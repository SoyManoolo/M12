export enum VideoCallEvent {
  OFFER = 'video:offer',
  ANSWER = 'video:answer',
  ICE_CANDIDATE = 'video:ice-candidate',
  CALL_STARTED = 'video:call-started',
  CALL_ENDED = 'video:call-ended',
  CALL_REJECTED = 'video:call-rejected',
  CALL_ACCEPTED = 'video:call-accepted',
  CALL_MISSED = 'video:call-missed',
  CALL_ERROR = 'video:call-error',
  CHAT_MESSAGE = 'video:chat-message',
  CALL_RATING = 'video:call-rating'
}

export interface VideoCallState {
  isCallActive: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isConnecting: boolean;
  error: string | null;
  callDuration: number;
  remoteUser: {
    userId: string;
    username: string;
    name: string;
    profilePictureUrl: string | null;
  } | null;
}

export interface VideoCallOffer {
  offer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

export interface VideoCallAnswer {
  answer: RTCSessionDescriptionInit;
  from: string;
  to: string;
}

export interface VideoCallIceCandidate {
  candidate: RTCIceCandidateInit;
  from: string;
  to: string;
}

export interface VideoCallError {
  code: string;
  message: string;
  details?: any;
} 