export interface ReceivedOfferData {
  offer: RTCSessionDescriptionInit;
  from: string;
  callId: string;
}

export interface ReceivedAnswerData {
  answer: RTCSessionDescriptionInit;
  from: string;
  callId: string;
}

export interface ReceivedIceCandidateData {
  candidate: RTCIceCandidateInit;
  from: string;
  callId: string;
}
