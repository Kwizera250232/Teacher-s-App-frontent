import { useRef, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * WebRTC audio hook for Live Coaching.
 * Uses mesh networking — each participant connects to every other participant.
 * Signaling goes through the backend polling endpoints.
 *
 * Key design:
 * - ALL participants create peer connections to ALL others (for receiving audio)
 * - Mic tracks are only ADDED when the user has permission to speak and enables mic
 * - Teacher always has speak permission
 * - Students get speak permission when teacher grants it (speak_permission_id)
 *
 * @param {Object} opts
 * @param {string} opts.classId
 * @param {string} opts.sessionId
 * @param {string} opts.token
 * @param {Object} opts.user — { id, name }
 * @param {boolean} opts.canSpeak — whether this user has permission to speak
 * @param {Array}  opts.participants — [{ student_id, name }]
 * @param {boolean} opts.isTeacher — whether this user is the teacher
 */
export function useCoachingAudio({ classId, sessionId, token, user, canSpeak, participants, isTeacher }) {
  const [micOn, setMicOn] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // userId -> { pc, audioEl, hasLocalTracks }
  const signalLastIdRef = useRef(0);
  const micOnRef = useRef(false);
  const canSpeakRef = useRef(canSpeak);
  const isTeacherRef = useRef(isTeacher);
  const volumeRef = useRef(volume);
  const audioEnabledRef = useRef(audioEnabled);
  const participantsRef = useRef(participants);

  useEffect(() => { micOnRef.current = micOn; }, [micOn]);
  useEffect(() => { canSpeakRef.current = canSpeak; }, [canSpeak]);
  useEffect(() => { isTeacherRef.current = isTeacher; }, [isTeacher]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // Get local mic stream
  const startMic = useCallback(async () => {
    // Students can only use mic if they have speak permission
    if (!canSpeakRef.current && !isTeacherRef.current) {
      console.warn('[audio] No speak permission to use mic');
      return false;
    }
    try {
      if (localStreamRef.current) {
        // Already have a stream, just re-enable tracks
        localStreamRef.current.getTracks().forEach(t => { t.enabled = true; });
        setMicOn(true);
        micOnRef.current = true;
        return true;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      localStreamRef.current = stream;
      setMicOn(true);
      micOnRef.current = true;
      // Add tracks to ALL existing peer connections
      Object.values(peersRef.current).forEach(peer => {
        if (!peer.hasLocalTracks) {
          stream.getTracks().forEach(track => {
            peer.pc.addTrack(track, stream);
          });
          peer.hasLocalTracks = true;
        }
        // Renegotiate by sending a new offer
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
      localStreamRef.current.getTracks().forEach(t => { t.enabled = false; });
    }
    setMicOn(false);
    micOnRef.current = false;
    // Note: we keep the peer connections and don't remove tracks,
    // just disable them. This avoids renegotiation issues.
  }, []);

  const toggleMic = useCallback(() => {
    if (micOnRef.current) stopMic();
    else startMic();
  }, [startMic, stopMic]);

  const changeVolume = useCallback((vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    volumeRef.current = clamped;
    // Apply to all received audio elements
    Object.values(peersRef.current).forEach(peer => {
      if (peer.audioEl) peer.audioEl.volume = clamped;
    });
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const next = !prev;
      audioEnabledRef.current = next;
      Object.values(peersRef.current).forEach(peer => {
        if (peer.audioEl) peer.audioEl.muted = !next;
      });
      return next;
    });
  }, []);

  // Create a peer connection for a user — always for receiving audio
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
    audioEl.muted = !audioEnabledRef.current;

    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
      audioEl.play().catch(() => {});
      setConnected(true);
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

    // Add local tracks if mic is on and we have a stream
    if (localStreamRef.current && micOnRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    const peer = { pc, audioEl, userId: otherUserId, hasLocalTracks: !!(localStreamRef.current && micOnRef.current) };
    peersRef.current[otherUserId] = peer;
    setPeerCount(Object.keys(peersRef.current).length);
    return peer;
  }, [classId, sessionId, token]);

  // Create and send an offer
  const createOffer = useCallback(async (peer) => {
    try {
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

  // Handle incoming signal
  const handleSignal = useCallback(async (sig) => {
    const fromId = sig.from_user_id;
    if (fromId === user.id) return;

    let peer = peersRef.current[fromId];
    const data = JSON.parse(sig.signal_data);

    if (sig.signal_type === 'offer') {
      if (!peer) peer = createPeer(fromId);
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data));
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

  // Create peer connections to ALL participants — everyone connects to everyone
  // This ensures all participants can RECEIVE audio from the teacher and permitted students
  useEffect(() => {
    if (!participants || participants.length === 0) return;
    participants.forEach(p => {
      const pid = p.student_id || p.id;
      if (pid === user.id) return;
      if (!peersRef.current[pid]) {
        const peer = createPeer(pid);
        // Initiate offer to establish connection
        createOffer(peer);
      }
    });
  }, [participants, user.id, createPeer, createOffer]);

  // When speak permission changes and mic was pending, auto-start mic
  useEffect(() => {
    if (canSpeak && !micOnRef.current && isTeacherRef.current === false) {
      // Don't auto-start, but enable the toggle button
      // User must press mic button themselves for browser permission
    }
  }, [canSpeak]);

  // When speak permission is revoked, stop mic
  useEffect(() => {
    if (!canSpeak && !isTeacherRef.current && micOnRef.current) {
      stopMic();
    }
  }, [canSpeak, stopMic]);

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
