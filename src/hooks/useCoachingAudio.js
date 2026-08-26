import { useRef, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * WebRTC audio hook for Live Coaching.
 * Uses mesh networking — each participant connects to every other participant.
 * Signaling goes through the backend polling endpoints.
 *
 * @param {Object} opts
 * @param {string} opts.classId
 * @param {string} opts.sessionId
 * @param {string} opts.token
 * @param {Object} opts.user — { id, name }
 * @param {boolean} opts.canSpeak — whether this user has permission to speak
 * @param {Array}  opts.participants — [{ student_id, name }]
 */
export function useCoachingAudio({ classId, sessionId, token, user, canSpeak, participants }) {
  const [micOn, setMicOn] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // userId -> { pc, audioEl }
  const signalLastIdRef = useRef(0);
  const micOnRef = useRef(false);
  const canSpeakRef = useRef(canSpeak);
  const volumeRef = useRef(volume);

  useEffect(() => { micOnRef.current = micOn; }, [micOn]);
  useEffect(() => { canSpeakRef.current = canSpeak; }, [canSpeak]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // Get local mic stream
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      localStreamRef.current = stream;
      // Apply volume via Web Audio API
      applyVolumeToStream(stream, volumeRef.current);
      setMicOn(true);
      micOnRef.current = true;
      // Add tracks to existing peer connections
      Object.values(peersRef.current).forEach(peer => {
        stream.getTracks().forEach(track => {
          if (!peer.pc.getSenders().find(s => s.track === track)) {
            peer.pc.addTrack(track, stream);
          }
        });
        // Renegotiate
        createOffer(peer);
      });
      return true;
    } catch (e) {
      console.error('[audio] mic error:', e);
      return false;
    }
  }, []);

  const stopMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setMicOn(false);
    micOnRef.current = false;
    // Remove senders from peer connections
    Object.values(peersRef.current).forEach(peer => {
      peer.pc.getSenders().forEach(s => {
        if (s.track) peer.pc.removeTrack(s);
      });
      createOffer(peer);
    });
  }, []);

  const toggleMic = useCallback(() => {
    if (micOnRef.current) stopMic();
    else startMic();
  }, [startMic, stopMic]);

  // Apply volume to a stream using Web Audio API
  const applyVolumeToStream = (stream, vol) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const gain = ctx.createGain();
      gain.gain.value = vol;
      source.connect(gain);
      // Note: the modified stream for output would need a destination,
      // but for peer connections we use the original stream tracks.
      // Volume control on received audio is done via the audio element.
    } catch (e) {
      console.error('[audio] volume error:', e);
    }
  };

  const changeVolume = useCallback((vol) => {
    setVolume(vol);
    volumeRef.current = vol;
    // Apply to all received audio elements
    Object.values(peersRef.current).forEach(peer => {
      if (peer.audioEl) peer.audioEl.volume = vol;
    });
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const next = !prev;
      Object.values(peersRef.current).forEach(peer => {
        if (peer.audioEl) peer.audioEl.muted = !next;
      });
      return next;
    });
  }, []);

  // Create a peer connection for a user
  const createPeer = useCallback((otherUserId) => {
    if (peersRef.current[otherUserId]) return peersRef.current[otherUserId];
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    const audioEl = new Audio();
    audioEl.autoplay = true;
    audioEl.volume = volumeRef.current;
    audioEl.muted = !audioEnabled;

    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
      audioEl.play().catch(() => {});
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

    // Add local tracks if mic is on
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    const peer = { pc, audioEl, userId: otherUserId };
    peersRef.current[otherUserId] = peer;
    setPeerCount(Object.keys(peersRef.current).length);
    return peer;
  }, [classId, sessionId, token, audioEnabled]);

  // Create and send an offer
  const createOffer = useCallback(async (peer) => {
    try {
      const offer = await peer.pc.createOffer();
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

  // Handle incoming signal
  const handleSignal = useCallback(async (sig) => {
    const fromId = sig.from_user_id;
    if (fromId === user.id) return;

    let peer = peersRef.current[fromId];
    const data = JSON.parse(sig.signal_data);

    if (sig.signal_type === 'offer') {
      if (!peer) peer = createPeer(fromId);
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data));
      // Only add local tracks if we can speak
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      await api.post(
        `/classes/${classId}/coaching-sessions/${sessionId}/signal`,
        { to_user_id: fromId, signal_type: 'answer', signal_data: JSON.stringify(answer) },
        token
      );
      setConnected(true);
    } else if (sig.signal_type === 'answer') {
      if (!peer) peer = createPeer(fromId);
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data));
      setConnected(true);
    } else if (sig.signal_type === 'ice') {
      if (!peer) peer = createPeer(fromId);
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(data));
      } catch (e) { /* ignore */ }
    }
  }, [classId, sessionId, token, user, createPeer]);

  // Poll for signals
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
    const interval = setInterval(pollSignals, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [classId, sessionId, token, handleSignal]);

  // Create offers to new participants (only if we can speak or are the teacher)
  useEffect(() => {
    if (!participants || participants.length === 0) return;
    // Only initiate offers if we have mic on or can speak
    if (!micOnRef.current && !canSpeakRef.current) return;
    participants.forEach(p => {
      const pid = p.student_id || p.id;
      if (pid === user.id) return;
      if (!peersRef.current[pid]) {
        const peer = createPeer(pid);
        createOffer(peer);
      }
    });
  }, [participants, user.id, canSpeak, createPeer, createOffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach(peer => {
        peer.pc.close();
        if (peer.audioEl) peer.audioEl.srcObject = null;
      });
      peersRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return {
    micOn, volume, audioEnabled, connected, peerCount,
    toggleMic, changeVolume, toggleAudio, startMic, stopMic,
  };
}
