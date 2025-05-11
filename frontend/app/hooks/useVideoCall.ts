import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import WebRTCService from '~/services/webrtc.service';
import SocketService from '~/services/socket.service';
import { VideoCallEvent, VideoCallState, VideoCallError } from '~/types/videocall.types';

const initialState: VideoCallState = {
  isCallActive: false,
  isVideoEnabled: true,
  isAudioEnabled: true,
  isConnecting: false,
  error: null,
  callDuration: 0,
  remoteUser: null,
};

export function useVideoCall() {
  const { token } = useAuth();
  const [state, setState] = useState<VideoCallState>(initialState);
  const webRTCService = WebRTCService.getInstance();
  const socketService = SocketService.getInstance();

  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }
    return () => {
      socketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (state.isCallActive) {
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          callDuration: prev.callDuration + 1
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.isCallActive]);

  const startCall = useCallback(async (remoteUserId: string) => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      await webRTCService.initializePeerConnection();
      await webRTCService.getUserMedia();
      
      const offer = await webRTCService.createOffer();
      socketService.emit(VideoCallEvent.OFFER, {
        offer,
        to: remoteUserId
      });

      setState(prev => ({
        ...prev,
        isCallActive: true,
        isConnecting: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: (error as Error).message
      }));
    }
  }, []);

  const endCall = useCallback(async () => {
    try {
      await webRTCService.closeConnection();
      setState(initialState);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message
      }));
    }
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

  const handleError = useCallback((error: VideoCallError) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      isConnecting: false
    }));
  }, []);

  return {
    state,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    handleError,
    localStream: webRTCService.getLocalStream(),
    remoteStream: webRTCService.getRemoteStream()
  };
} 