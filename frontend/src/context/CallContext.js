import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState(null); // { callId, type, status, caller, receiver, conversationId }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnection = useRef(null);
  const callStateRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const ensureSocket = () => {
    const socket = getSocket();
    if (!socket) throw new Error('Socket not connected');
    if (!socket.connected) socket.connect();
    return socket;
  };

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const setCallStateSafe = useCallback((next) => {
    callStateRef.current = typeof next === 'function' ? next(callStateRef.current) : next;
    setCallState(callStateRef.current);
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getMediaStream = async (type) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }
    const constraints = {
      audio: true,
      video: type === 'video' ? { width: 1280, height: 720 } : false,
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  };

  const createPeerConnection = useCallback((callId, receiverId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const socket = getSocket();
        socket?.emit('call:ice-candidate', { receiverId, candidate: e.candidate, callId });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setRemoteStream(stream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  }, []);

  // Initiate a call
  const initiateCall = useCallback(async (receiver, callType, conversationId = null) => {
    try {
      if (!receiver?.id) return;
      const callId = `call_${Date.now()}`;
      setCallStateSafe({
        callId, type: callType, status: 'calling',
        caller: user, receiver, conversationId,
      });
      const socket = ensureSocket();
      const stream = await getMediaStream(callType);
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(callId, receiver.id);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('call:initiate', { receiverId: receiver.id, callType, callId, offer, conversationId });
    } catch (err) {
      console.error('Initiate call error:', err);
      setCallStateSafe(null);
      alert('Unable to start call. Please allow microphone/camera access and try again.');
    }
  }, [user, createPeerConnection, setCallStateSafe]);

  // Answer a call
  const answerCall = useCallback(async (callId, callerId, callType, offer) => {
    try {
      const state = callStateRef.current;
      const effectiveCallId = callId || state?.callId;
      const effectiveCallerId = callerId || state?.caller?.id;
      const effectiveType = callType || state?.type;
      const effectiveOffer = offer || state?.offer;
      console.log('[call] answer clicked', { effectiveCallId, effectiveCallerId, effectiveType });
      if (!effectiveCallId || !effectiveCallerId || !effectiveOffer) {
        console.warn('Answer call missing data', { effectiveCallId, effectiveCallerId, effectiveOffer });
        setCallStateSafe(null);
        return;
      }
      setCallStateSafe((prev) => (prev ? { ...prev, status: 'connecting' } : prev));
      const socket = ensureSocket();
      const stream = await getMediaStream(effectiveType);
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(effectiveCallId, effectiveCallerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(effectiveOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit('call:answer', {
        callerId: effectiveCallerId,
        answer,
        callId: effectiveCallId,
        callType: effectiveType,
        conversationId: callStateRef.current?.conversationId || null,
      });

      setCallStateSafe((prev) => (prev ? { ...prev, status: 'connected' } : prev));

      // Start timer
      callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error('Answer call error:', err);
    }
  }, [createPeerConnection, setCallStateSafe]);

  // Reject a call
  const rejectCall = useCallback((callId, callerId) => {
    try {
      const state = callStateRef.current;
      const effectiveCallId = callId || state?.callId;
      const effectiveCallerId = callerId || state?.caller?.id;
      console.log('[call] reject clicked', { effectiveCallId, effectiveCallerId });
      if (effectiveCallId && effectiveCallerId) {
        const socket = ensureSocket();
        socket?.emit('call:reject', {
          callerId: effectiveCallerId,
          callId: effectiveCallId,
          callType: callStateRef.current?.type,
          conversationId: callStateRef.current?.conversationId || null,
        });
      }
    } catch (err) {
      console.error('Reject call error:', err);
    }
    setCallStateSafe(null);
  }, [setCallStateSafe]);

  // End call
  const endCall = useCallback(() => {
    const state = callStateRef.current;
    if (state) {
      try {
        const socket = ensureSocket();
        const otherId = state.caller?.id === user?.id ? state.receiver?.id : state.caller?.id;
        if (otherId) {
          socket?.emit('call:end', {
            otherUserId: otherId,
            callId: state.callId,
            callType: state.type,
            conversationId: state.conversationId || null,
          });
        }
      } catch (err) {
        console.error('End call emit error:', err);
      }
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setRemoteStream(null);
    setCallStateSafe(null);
    setCallDuration(0);
  }, [localStream, user, setCallStateSafe]);

  // Toggle mute/video
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    }
  }, [localStream]);

  // Socket listeners for call events
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on('call:incoming', (data) => {
      setCallStateSafe({
        callId: data.callId, type: data.callType, status: 'incoming',
        caller: { id: data.callerId, fullName: data.callerName, avatar: data.callerAvatar },
        receiver: user,
        conversationId: data.conversationId || null,
        offer: data.offer,
      });
    });

    socket.on('call:answered', async ({ callId, answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStateSafe((prev) => (prev ? { ...prev, status: 'connected' } : prev));
        callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      }
    });

    socket.on('call:rejected', () => {
      endCall();
    });

    socket.on('call:ended', () => {
      if (peerConnection.current) peerConnection.current.close();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setRemoteStream(null);
      setLocalStream(null);
      setCallStateSafe(null);
      setCallDuration(0);
    });

    socket.on('call:ice-candidate', async ({ candidate }) => {
      try {
        if (peerConnection.current && candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('ICE candidate error:', err);
      }
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:answered');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:ice-candidate');
    };
  }, [user, endCall, localStream, setCallStateSafe]);

  return (
    <CallContext.Provider value={{
      callState, localStream, remoteStream,
      callDuration, localVideoRef, remoteVideoRef,
      initiateCall, answerCall, rejectCall, endCall,
      toggleMute, toggleVideo,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used inside CallProvider');
  return ctx;
};
