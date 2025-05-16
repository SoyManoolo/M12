import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import WebRTCService from '~/services/webrtc.service';
import SocketService from '~/services/socket.service';
import { VideoCallEvent, VideoCallState, QueueResult } from '~/types/videocall.types';

const initialState: VideoCallState = {
  isCallActive: false,
  isVideoEnabled: true,
  isAudioEnabled: true,
  isConnecting: false,
  error: null,
  callDuration: 0,
  inQueue: false,
  callId: null
};

export function useVideoCall() {
  const { token } = useAuth();
  const [state, setState] = useState<VideoCallState>(initialState);
  const webRTCService = WebRTCService.getInstance();
  const socketService = SocketService.getInstance();

  // Contador de tiempo de llamada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isCallActive) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          callDuration: prev.callDuration + 1
        }));
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isCallActive]);

  useEffect(() => {
    if (token) {
      socketService.connect(token);
      setupQueueListeners();
    }
    return () => {
      socketService.disconnect();
    };
  }, [token]);

  const setupQueueListeners = useCallback(() => {
    socketService.on(VideoCallEvent.QUEUE_RESULT, (result: QueueResult) => {
      setState(prev => ({
        ...prev,
        inQueue: result.success,
        error: result.success ? null : result.message
      }));
    });

    socketService.on(VideoCallEvent.MATCH_FOUND, (data) => {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        inQueue: false,
        callId: data.call_id
      }));
    });

    socketService.on(VideoCallEvent.CALL_CONNECTED_RESULT, (result: QueueResult) => {
      setState(prev => ({
        ...prev,
        isCallActive: result.success,
        isConnecting: false,
        error: result.success ? null : result.message
      }));
    });

    socketService.on(VideoCallEvent.END_CALL_RESULT, (result: QueueResult) => {
      if (result.success) {
        setState(initialState);
      } else {
        setState(prev => ({
          ...prev,
          error: result.message
        }));
      }
    });
  }, []);

  const joinQueue = useCallback(async () => {
    if (!token) return;
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    await webRTCService.joinQueue(token);
  }, [token]);

  const leaveQueue = useCallback(async () => {
    await webRTCService.leaveQueue();
    setState(prev => ({ ...prev, inQueue: false }));
  }, []);

  const startCall = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      await webRTCService.initializePeerConnection();
      await webRTCService.getUserMedia();

      setState(prev => ({
        ...prev,
        isCallActive: true,
        isConnecting: false
      }));
    } catch (error) {
      handleError(error as Error);
    }
  }, []);

  const endCall = useCallback(() => {
    try {
      webRTCService.endCall();
      setState(initialState);
    } catch (error) {
      handleError(error as Error);
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      isConnecting: false,
      error: error.message
    }));
  }, []);

  const toggleVideo = useCallback(() => {
    const localStream = webRTCService.getLocalStream();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({
          ...prev,
          isVideoEnabled: videoTrack.enabled
        }));
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const localStream = webRTCService.getLocalStream();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({
          ...prev,
          isAudioEnabled: audioTrack.enabled
        }));
      }
    }
  }, []);

  return {
    state,
    joinQueue,
    leaveQueue,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    handleError,
    localStream: webRTCService.getLocalStream(),
    remoteStream: webRTCService.getRemoteStream()
  };
} 