import { VideoCallEvent, VideoCallError, MatchFoundData } from '~/types/videocall.types';
import SocketService from './socket.service';

class WebRTCService {
  private static instance: WebRTCService;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socketService: SocketService;
  private currentCallId: string | null = null;

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

  private setupSocketListeners() {
    this.socketService.on(VideoCallEvent.MATCH_FOUND, async (data: MatchFoundData) => {
      try {
        this.currentCallId = data.call_id;
        await this.initializePeerConnection();
        await this.getUserMedia();
        
        const offer = await this.createOffer();
        this.socketService.emit(VideoCallEvent.SEND_OFFER, {
          offer,
          from: data.self.id,
          to: data.match.id
        });
      } catch (error) {
        console.error('Error al manejar el emparejamiento:', error);
      }
    });

    this.socketService.on(VideoCallEvent.SEND_OFFER, async (data) => {
      try {
        if (!this.peerConnection) {
          await this.initializePeerConnection();
          await this.getUserMedia();
        }
        await this.handleOffer(data.offer);
        this.socketService.emit(VideoCallEvent.SEND_ANSWER, {
          answer: await this.createAnswer(),
          from: data.to,
          to: data.from
        });
      } catch (error) {
        console.error('Error al manejar la oferta:', error);
      }
    });

    this.socketService.on(VideoCallEvent.SEND_ANSWER, async (data) => {
      try {
        await this.handleAnswer(data.answer);
      } catch (error) {
        console.error('Error al manejar la respuesta:', error);
      }
    });

    this.socketService.on(VideoCallEvent.SEND_ICE_CANDIDATE, async (data) => {
      try {
        await this.handleIceCandidate(data.candidate);
      } catch (error) {
        console.error('Error al manejar el candidato ICE:', error);
      }
    });
  }

  public async initializePeerConnection(): Promise<void> {
    try {
      // Obtener configuración de servidores ICE del backend
      this.socketService.emit(VideoCallEvent.GET_ICE_SERVERS, {});
      
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socketService.emit(VideoCallEvent.SEND_ICE_CANDIDATE, {
            candidate: event.candidate
          });
        }
      };

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
      };

      this.socketService.emit(VideoCallEvent.CALL_CONNECTED, {
        call_id: this.currentCallId
      });

    } catch (error) {
      console.error('Error al inicializar la conexión:', error);
      throw error;
    }
  }

  public async joinQueue(userId: string): Promise<void> {
    this.socketService.emit(VideoCallEvent.ADD_TO_QUEUE, { user_id: userId });
  }

  public async leaveQueue(): Promise<void> {
    this.socketService.emit(VideoCallEvent.LEAVE_QUEUE, {});
  }

  public async endCall(): Promise<void> {
    if (this.currentCallId) {
      this.socketService.emit(VideoCallEvent.END_CALL, {
        call_id: this.currentCallId
      });
      this.closeConnection();
    }
  }

  public async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }
    } catch (error) {
      console.error('Error al obtener acceso a los dispositivos:', error);
      throw error;
    }
  }

  private async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('La conexión no está inicializada');
    }

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error al crear la oferta:', error);
      throw error;
    }
  }

  private async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('La conexión no está inicializada');
    }

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error al crear la respuesta:', error);
      throw error;
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('La conexión no está inicializada');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    } catch (error) {
      console.error('Error al manejar la oferta:', error);
      throw error;
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('La conexión no está inicializada');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error al manejar la respuesta:', error);
      throw error;
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('La conexión no está inicializada');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error al manejar el candidato ICE:', error);
      throw error;
    }
  }

  public closeConnection(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

export default WebRTCService; 