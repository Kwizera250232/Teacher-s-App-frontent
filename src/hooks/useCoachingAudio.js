import { useRef, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * WebRTC audio hook for Live Coaching.
 * Mesh networking with polling-based signaling.
 *
 * Audio routing:
 * - Remote audio plays through AudioContext → GainNode → ctx.destination
 *   This follows the system output device (headphones when plugged in).
 * - The Audio element is kept muted as fallback only.
 * - Volume is controlled via GainNode, not audioEl.volume.
 * - Local mic uses echoCancellation + noiseSuppression + autoGainControl.
 */
export function useCoachingAudio({ classId, sessionId, token, user, canSpeak, participants, isTeacher }) {
  const [micOn, setMicOn] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [speakingLevel, setSpeakingLevel] = useState(0);
  const [remoteSpeaking, setRemoteSpeaking] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const signalLastIdRef = useRef(0);
  const micOnRef = useRef(false);
  const canSpeakRef = useRef(canSpeak);
  const isTeacherRef = useRef(isTeacher);
  const volumeRef = useRef(volume);
  const audioEnabledRef = useRef(audioEnabled);
  const participantsRef = useRef(participants);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastLevelUpdateRef = useRef(0);
  const remoteLevelsRef = useRef({});
  const lastRemoteUpdateRef = useRef(0);

  useEffect(() => { micOnRef.current = micOn; }, [micOn]);
  useEffect(() => { canSpeakRef.current = canSpeak; }, [canSpeak]);
  useEffect(() => { isTeacherRef.current = isTeacher; }, [isTeacher]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // ── Apply volume to all peers (GainNode + fallback audioEl) ──
  const applyVolumeToAll = useCallback((vol) => {
    Object.values(peersRef.current).forEach(peer => {
      if (peer.gainNode) {
        try {
          peer.gainNode.gain.setValueAtTime(vol, peer.audioCtx.currentTime);
        } catch (e) {
          peer.gainNode.gain.value = vol;
        }
      }
      if (peer.audioEl) peer.audioEl.volume = vol;
    });
  }, []);

  // ── Apply mute to all peers ──
  const applyMuteToAll = useCallback((muted) => {
    Object.values(peersRef.current).forEach(peer => {
      if (peer.gainNode) {
        try {
          peer.gainNode.gain.setValueAtTime(muted ? 0 : volumeRef.current, peer.audioCtx.currentTime);
        } catch (e) {
          peer.gainNode.gain.value = muted ? 0 : volumeRef.current;
        }
      }
      if (peer.audioEl) peer.audioEl.muted = muted;
    });
  }, []);

  // ── Local mic audio level detection (throttled) ──
  const startLevelDetection = useCallback(() => {
    if (!localStreamRef.current) return;
    try {
      if (analyserRef.current) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(localStreamRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length / 255;
        const now = performance.now();
        if (now - lastLevelUpdateRef.current > 100) {
          lastLevelUpdateRef.current = now;
          setSpeakingLevel(avg);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error('[audio] level detection error:', e);
    }
  }, []);

  const stopLevelDetection = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.context.close(); } catch (e) {}
      analyserRef.current = null;
    }
    setSpeakingLevel(0);
  }, []);

  // ── Create and send an offer ──
  const createOffer = useCallback(async (peer) => {
    try {
      console.log('[audio] Creating offer to', peer.userId);
      const offer = await peer.pc.createOffer({ offerToReceiveAudio: true });
      await peer.pc.setLocalDescription(offer);
      await api.post(
        `/classes/${classId}/coaching-sessions/${sessionId}/signal`,
        { to_user_id: peer.userId, signal_type: 'offer', signal_data: JSON.stringify(offer) },
        token
      );
    } catch (e) {
      console.error('[audio] offer error:', e);
    }
  }, [classId, sessionId, token]);

  // ── Create a peer connection ──
  const createPeer = useCallback((otherUserId) => {
    if (peersRef.current[otherUserId]) return peersRef.current[otherUserId];
    console.log('[audio] Creating peer connection to', otherUserId);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:93.127.186.217:3478' },
        {
          urls: 'turn:93.127.186.217:3478',
          username: 'umunsi',
          credential: 'umunsi2024',
        },
        {
          urls: 'turn:93.127.186.217:3478?transport=tcp',
          username: 'umunsi',
          credential: 'umunsi2024',
        },
      ],
    });

    // Audio element as fallback — muted because we play through AudioContext
    const audioEl = new Audio();
    audioEl.autoplay = true;
    audioEl.setAttribute('playsinline', '');
    audioEl.volume = volumeRef.current;
    audioEl.muted = true; // always muted — AudioContext handles playback

    const peer = {
      pc,
      audioEl,
      userId: otherUserId,
      hasLocalTracks: false,
      iceBuffer: [],
      remoteDescSet: false,
      levelFrame: null,
      analyser: null,
      audioCtx: null,
      gainNode: null,
    };

    pc.ontrack = (e) => {
      console.log('[audio] Got remote track from', otherUserId);
      audioEl.srcObject = e.streams[0];
      setConnected(true);

      // Route audio through AudioContext → GainNode → destination
      // This ensures audio follows the system output device (headphones)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Resume if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const source = ctx.createMediaStreamSource(e.streams[0]);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const gainNode = ctx.createGain();
        gainNode.gain.value = audioEnabledRef.current ? volumeRef.current : 0;

        // Audio graph: source → analyser → gainNode → destination
        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(ctx.destination);

        peer.audioCtx = ctx;
        peer.gainNode = gainNode;
        peer.analyser = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!peer.analyser) return;
          peer.analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255;
          remoteLevelsRef.current[otherUserId] = avg;
          const now = performance.now();
          if (now - lastRemoteUpdateRef.current > 150) {
            lastRemoteUpdateRef.current = now;
            setRemoteSpeaking({ ...remoteLevelsRef.current });
          }
          peer.levelFrame = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn('[audio] AudioContext routing failed, falling back to Audio element:', err);
        // Fallback: play through Audio element directly
        audioEl.muted = !audioEnabledRef.current;
        audioEl.play().catch(playErr => console.warn('[audio] fallback play error:', playErr));
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        api.post(
          `/classes/${classId}/coaching-sessions/${sessionId}/signal`,
          { to_user_id: otherUserId, signal_type: 'ice', signal_data: JSON.stringify(e.candidate) },
          token
        ).catch(() => {});
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[audio] ICE state:', pc.iceConnectionState, 'with', otherUserId);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[audio] Connection state:', pc.connectionState, 'with', otherUserId);
      if (pc.connectionState === 'connected') setConnected(true);
    };

    // Add local tracks if mic is on
    if (localStreamRef.current && micOnRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
      peer.hasLocalTracks = true;
    }

    peersRef.current[otherUserId] = peer;
    setPeerCount(Object.keys(peersRef.current).length);
    return peer;
  }, [classId, sessionId, token]);

  // ── Flush buffered ICE candidates ──
  const flushIceBuffer = useCallback(async (peer) => {
    if (peer.iceBuffer.length > 0 && peer.remoteDescSet) {
      for (const candidate of peer.iceBuffer) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[audio] buffered ICE error:', e);
        }
      }
      peer.iceBuffer = [];
    }
  }, []);

  // ── Handle incoming signal ──
  const handleSignal = useCallback(async (sig) => {
    const fromId = sig.from_user_id;
    if (fromId === user.id) return;

    let peer = peersRef.current[fromId];
    const data = JSON.parse(sig.signal_data);

    if (sig.signal_type === 'offer') {
      if (!peer) peer = createPeer(fromId);
      console.log('[audio] Got offer from', fromId);
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data));
        peer.remoteDescSet = true;
        await flushIceBuffer(peer);
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        await api.post(
          `/classes/${classId}/coaching-sessions/${sessionId}/signal`,
          { to_user_id: fromId, signal_type: 'answer', signal_data: JSON.stringify(answer) },
          token
        );
        setConnected(true);
      } catch (e) {
        console.error('[audio] offer handling error:', e);
      }
    } else if (sig.signal_type === 'answer') {
      if (!peer) peer = createPeer(fromId);
      console.log('[audio] Got answer from', fromId);
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data));
        peer.remoteDescSet = true;
        await flushIceBuffer(peer);
        setConnected(true);
      } catch (e) {
        console.error('[audio] answer handling error:', e);
      }
    } else if (sig.signal_type === 'ice') {
      if (!peer) peer = createPeer(fromId);
      try {
        if (peer.remoteDescSet) {
          await peer.pc.addIceCandidate(new RTCIceCandidate(data));
        } else {
          peer.iceBuffer.push(data);
        }
      } catch (e) {
        console.warn('[audio] ICE error:', e);
      }
    }
  }, [classId, sessionId, token, user, createPeer, flushIceBuffer]);

  // ── Start mic ──
  const startMic = useCallback(async () => {
    if (!canSpeakRef.current && !isTeacherRef.current) {
      console.warn('[audio] No speak permission to use mic');
      return false;
    }
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => { t.enabled = true; });
        setMicOn(true);
        micOnRef.current = true;
        if (!analyserRef.current) startLevelDetection();
        return true;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });
      localStreamRef.current = stream;
      setMicOn(true);
      micOnRef.current = true;
      startLevelDetection();

      // Add tracks to ALL existing peer connections and renegotiate
      const peerList = Object.values(peersRef.current);
      for (const peer of peerList) {
        if (!peer.hasLocalTracks) {
          stream.getTracks().forEach(track => {
            peer.pc.addTrack(track, stream);
          });
          peer.hasLocalTracks = true;
        }
      }
      for (const peer of peerList) {
        const myId = String(user.id);
        const otherId = String(peer.userId);
        if (myId > otherId) {
          createOffer(peer);
        }
      }
      return true;
    } catch (e) {
      console.error('[audio] mic error:', e);
      return false;
    }
  }, [startLevelDetection, user.id, createOffer]);

  const stopMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => { t.enabled = false; });
    }
    setMicOn(false);
    micOnRef.current = false;
    stopLevelDetection();
  }, [stopLevelDetection]);

  const toggleMic = useCallback(() => {
    if (micOnRef.current) stopMic();
    else startMic();
  }, [startMic, stopMic]);

  const changeVolume = useCallback((vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    volumeRef.current = clamped;
    applyVolumeToAll(clamped);
  }, [applyVolumeToAll]);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const next = !prev;
      audioEnabledRef.current = next;
      applyMuteToAll(!next);
      return next;
    });
  }, [applyMuteToAll]);

  // ── Poll for signals ──
  useEffect(() => {
    if (!sessionId || !token) return;
    let active = true;
    const pollSignals = async () => {
      if (!active) return;
      try {
        const signals = await api.get(
          `/classes/${classId}/coaching-sessions/${sessionId}/signal?since=${signalLastIdRef.current}`,
          token
        );
        if (signals && signals.length > 0) {
          for (const sig of signals) {
            if (sig.id > signalLastIdRef.current) signalLastIdRef.current = sig.id;
            await handleSignal(sig);
          }
        }
      } catch (e) { /* silent */ }
    };
    pollSignals();
    const interval = setInterval(pollSignals, 1000);
    return () => { active = false; clearInterval(interval); };
  }, [classId, sessionId, token, handleSignal]);

  // ── Create peer connections to ALL participants ──
  useEffect(() => {
    if (!participants || participants.length === 0) return;
    const myId = String(user.id);
    participants.forEach(p => {
      const pid = String(p.student_id || p.id);
      if (pid === myId) return;
      if (!peersRef.current[pid]) {
        const peer = createPeer(pid);
        if (myId > pid) {
          createOffer(peer);
        }
      }
    });
  }, [participants, user.id, createPeer, createOffer]);

  // ── When speak permission is granted, renegotiate ──
  useEffect(() => {
    if (canSpeak && micOnRef.current) {
      const myId = String(user.id);
      Object.values(peersRef.current).forEach(peer => {
        if (myId > String(peer.userId)) {
          createOffer(peer);
        }
      });
    }
  }, [canSpeak, createOffer, user.id]);

  // ── Auto-start teacher's mic ──
  useEffect(() => {
    if (isTeacher && !micOnRef.current) {
      startMic().then(ok => {
        if (!ok) console.log('[audio] Teacher mic auto-start deferred');
      }).catch(() => {});
    }
  }, [isTeacher, startMic]);

  // ── When speak permission is revoked, stop mic ──
  useEffect(() => {
    if (!canSpeak && !isTeacherRef.current && micOnRef.current) {
      stopMic();
    }
  }, [canSpeak, stopMic]);

  // ── Handle device changes (headphone plug/unplug) ──
  // When headphones are plugged in, resume all AudioContexts so audio
  // routes to the new output device automatically.
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log('[audio] Audio device changed (headphone plug/unplug)');
      Object.values(peersRef.current).forEach(peer => {
        if (peer.audioCtx && peer.audioCtx.state === 'suspended') {
          peer.audioCtx.resume().catch(() => {});
        }
      });
    };
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopLevelDetection();
      Object.values(peersRef.current).forEach(peer => {
        if (peer.levelFrame) cancelAnimationFrame(peer.levelFrame);
        if (peer.audioCtx) {
          try { peer.audioCtx.close(); } catch (e) {}
        }
        try { peer.pc.close(); } catch (e) {}
        if (peer.audioEl) peer.audioEl.srcObject = null;
      });
      peersRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [stopLevelDetection]);

  return {
    micOn, volume, audioEnabled, connected, peerCount,
    speakingLevel, remoteSpeaking,
    toggleMic, changeVolume, toggleAudio, startMic, stopMic,
  };
}
