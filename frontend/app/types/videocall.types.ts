export enum VideoCallEvent {
  // Eventos de cola
  ADD_TO_QUEUE = 'add_to_queue',
  QUEUE_RESULT = 'queue_result',
  LEAVE_QUEUE = 'leave_queue',
  LEAVE_QUEUE_RESULT = 'leave_queue_result',
  
  // Eventos de llamada
  CALL_CONNECTED = 'call_connected',
  CALL_CONNECTED_RESULT = 'call_connected_result',
  END_CALL = 'end_call',
  END_CALL_RESULT = 'end_call_result',
  
  // Eventos WebRTC
  SEND_OFFER = 'send_offer',
  SEND_OFFER_RESULT = 'send_offer_result',
  SEND_ANSWER = 'send_answer',
  SEND_ANSWER_RESULT = 'send_answer_result',
  SEND_ICE_CANDIDATE = 'send_ice_candidate',
  SEND_ICE_CANDIDATE_RESULT = 'send_ice_candidate_result',
  
  // Eventos de emparejamiento
  REQUEST_MATCH = 'request_match',
  REQUEST_MATCH_RESULT = 'request_match_result',
  MATCH_FOUND = 'match_found',
  
  // Eventos de configuración
  GET_ICE_SERVERS = 'get_ice_servers',
  GET_ICE_SERVERS_RESULT = 'get_ice_servers_result',
  
  // Eventos de chat y calificación
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
  inQueue: boolean;
  callId: string | null;
}

export interface QueueResult {
  success: boolean;
  message: string;
}

export interface MatchFoundData {
  call_id: string;
  match: {
    id: string;
    socketId: string;
  };
  self: {
    id: string;
    socketId: string;
  };
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
  success: boolean;
  message: string;
} 