import SocketService from './socket.service';
import { VideoCallEvent } from '~/types/videocall.types';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private static instance: WebRTCService;
  private socketService: SocketService;

  private constructor() {
    this.socketService = SocketService.getInstance();
    this.setupSocketListeners();
  }

  public static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  private setupSocketListeners(): void {
    this.socketService.on(VideoCallEvent.OFFER, this.handleOffer.bind(this));
    this.socketService.on(VideoCallEvent.ANSWER, this.handleAnswer.bind(this));
    this.socketService.on(VideoCallEvent.ICE_CANDIDATE, this.handleIceCandidate.bind(this));
  }

  public async initializePeerConnection(): Promise<void> {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);
    this.setupPeerConnectionListeners();
  }

  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.emit(VideoCallEvent.ICE_CANDIDATE, {
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Estado de conexión:', this.peerConnection?.connectionState);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('Estado ICE:', this.peerConnection?.iceConnectionState);
    };
  }

  public async getUserMedia(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (this.peerConnection) {
        this.localStream.getTracks().forEach((track) => {
          if (this.peerConnection) {
            this.peerConnection.addTrack(track, this.localStream!);
          }
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error al acceder a los dispositivos:', error);
      throw error;
    }
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection no inicializado');
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection no inicializado');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.socketService.emit(VideoCallEvent.ANSWER, { answer });
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection no inicializado');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection no inicializado');
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public async stopLocalStream(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  public async closeConnection(): Promise<void> {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    await this.stopLocalStream();
    this.remoteStream = null;
  }
}

export default WebRTCService; 