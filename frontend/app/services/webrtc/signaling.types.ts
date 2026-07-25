export interface ReceivedOfferData {
  offer: RTCSessionDescriptionInit;
  from: string;
}

export interface ReceivedAnswerData {
  answer: RTCSessionDescriptionInit;
  from: string;
}

export interface ReceivedIceCandidateData {
  candidate: RTCIceCandidateInit;
  from: string;
}
