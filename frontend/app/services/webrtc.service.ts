import { iceServersConfig } from '../config/rtc.config';
import {
    VideoCallEvent,
    MatchFoundData,
    VideoCallOffer,
    VideoCallAnswer,
    VideoCallIceCandidate
} from '~/types/videocall.types'; // Tus tipos
import SocketService from './socket.service';

// Tipos para los datos recibidos (payloads de señalización que vienen del otro par)
interface ReceivedOfferData {
    offer: RTCSessionDescriptionInit;
    from: string; // socketId de quien envió la oferta
}

interface ReceivedAnswerData {
    answer: RTCSessionDescriptionInit;
    from: string; // socketId de quien envió la respuesta
}

interface ReceivedIceCandidateData {
    candidate: RTCIceCandidateInit;
    from: string; // socketId de quien envió el candidato
}

class WebRTCService {
    private static instance: WebRTCService;
    public peerConnection: RTCPeerConnection | null = null;
    public localStream: MediaStream | null = null;
    public remoteStream: MediaStream | null = null;
    private socketService: SocketService;

    private currentCallId: string | null = null;
    private partnerSocketId: string | null = null;
    private partnerDBId: string | null = null; // Para chat/rating
    private isInitiator: boolean = false;
    private isSignalingSetup: boolean = false;

    // Callbacks para notificar a la UI/hook
    public onRemoteStreamArrived: ((stream: MediaStream | null) => void) | null = null;
    public onCallEndedByService: (() => void) | null = null;
    public onConnectionStateChange: ((state: RTCIceConnectionState) => void) | null = null;
    public onLocalStreamReady: ((stream: MediaStream | null) => void) | null = null;

    private constructor() {
        this.socketService = SocketService.getInstance();
    }

    public static getInstance(): WebRTCService {
        if (!WebRTCService.instance) {
            WebRTCService.instance = new WebRTCService();
        }
        return WebRTCService.instance;
    }

    public getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    public getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    public initializeService(): void {
        if (this.socketService.isConnected() && !this.isSignalingSetup) {
            this.setupSignalingListeners();
            this.isSignalingSetup = true;
        } else if (!this.socketService.isConnected()) {
            this.socketService.onConnect(() => { // Espera a que el socket conecte
                if (!this.isSignalingSetup) {
                    this.setupSignalingListeners();
                    this.isSignalingSetup = true;
                }
            });
        }
    }

    public setUICallbacks(
        onRemoteStream: (stream: MediaStream | null) => void,
        onCallEnded: () => void,
        onConnectionState: (state: RTCIceConnectionState) => void,
        onLocalStream: (stream: MediaStream | null) => void
    ) {
        this.onRemoteStreamArrived = onRemoteStream;
        this.onCallEndedByService = onCallEnded;
        this.onConnectionStateChange = onConnectionState;
        this.onLocalStreamReady = onLocalStream;
    }

    private async initializePeerConnection(): Promise<RTCPeerConnection> {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.peerConnection = new RTCPeerConnection({ iceServers: iceServersConfig });
        console.log("WebRTCService: RTCPeerConnection inicializado con:", iceServersConfig);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.partnerSocketId && this.currentCallId) {
                const payload: VideoCallIceCandidate = {
                    candidate: event.candidate,
                    from: this.socketService.getSocketId()!,
                    to: this.partnerSocketId,
                };
                this.socketService.emit(VideoCallEvent.SEND_ICE_CANDIDATE, payload);
            }
        };

        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            console.log("WebRTCService: Track remoto recibido.", this.remoteStream);
            if (this.onRemoteStreamArrived) {
                this.onRemoteStreamArrived(this.remoteStream);
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            if (this.peerConnection) {
                const state = this.peerConnection.iceConnectionState;
                if (this.onConnectionStateChange) this.onConnectionStateChange(state);

                if (state === 'connected' || state === 'completed') {
                    if (this.currentCallId) {
                        this.socketService.emit(VideoCallEvent.CALL_CONNECTED, { call_id: this.currentCallId });
                    }
                } else if (['failed', 'disconnected', 'closed'].includes(state)) {
                    console.log("WebRTCService: Conexión WebRTC fallida o cerrada.");
                    this.closeConnectionInternals(false);
                    if (this.onCallEndedByService) this.onCallEndedByService();
                }
            }
        };

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection!.addTrack(track, this.localStream!);
            });
        }
        return this.peerConnection;
    }

    private setupSignalingListeners() {
        console.log("WebRTCService: Configurando listeners de señalización...");

        this.socketService.on(VideoCallEvent.MATCH_FOUND, async (data: MatchFoundData & { isInitiator: boolean }) => {
            console.log("WebRTCService: MATCH_FOUND recibido:", data);
            if (this.currentCallId || (this.peerConnection && this.peerConnection.signalingState !== 'closed')) {
                console.warn("WebRTCService: MATCH_FOUND recibido pero una llamada parece estar activa o en proceso. Limpiando primero.");
                await this.closeConnection(); // Usa el método público para asegurar limpieza completa
            }
            try {
                this.currentCallId = data.call_id;
                this.partnerSocketId = data.match.socketId;
                this.partnerDBId = data.match.id;
                this.isInitiator = data.isInitiator;

                await this.initializePeerConnection();
                await this.getUserMedia();

                if (this.isInitiator) {
                    console.log("WebRTCService: Soy iniciador, creando y enviando oferta...");
                    const offer = await this.createOffer();
                    const payload: VideoCallOffer = {
                        offer,
                        from: this.socketService.getSocketId()!,
                        to: this.partnerSocketId,
                    };
                    this.socketService.emit(VideoCallEvent.SEND_OFFER, payload);
                } else {
                    console.log("WebRTCService: No soy iniciador, esperando oferta.");
                }
            } catch (error) {
                console.error('WebRTCService: Error en MATCH_FOUND:', error);
                this.closeConnection();
            }
        });

        // Escucha el mismo evento que se usa para enviar, asumiendo que el backend
        // reenvía el payload original, pero dirigido a este socket.
        // El backend DEBE añadir/confirmar el campo 'from' con el socketId del emisor original.
        this.socketService.on(VideoCallEvent.SEND_OFFER, async (data: ReceivedOfferData) => {
            if (!this.isInitiator && data.from === this.partnerSocketId && this.currentCallId) {
                console.log("WebRTCService: Oferta recibida de:", data.from);
                try {
                    if (!this.peerConnection) await this.initializePeerConnection(); // Podría ser necesario si el par fue más rápido
                    await this.getUserMedia(); // Asegurar que la media local esté lista
                    await this.handleOffer(data.offer);
                    const answer = await this.createAnswer();
                    const payload: VideoCallAnswer = {
                        answer,
                        from: this.socketService.getSocketId()!,
                        to: data.from, // Responder a quien envió la oferta
                    };
                    this.socketService.emit(VideoCallEvent.SEND_ANSWER, payload);
                } catch (error) {
                    console.error('WebRTCService: Error al manejar oferta recibida:', error);
                    this.closeConnection();
                }
            }
        });

        this.socketService.on(VideoCallEvent.SEND_ANSWER, async (data: ReceivedAnswerData) => {
            if (this.isInitiator && data.from === this.partnerSocketId && this.currentCallId) {
                console.log("WebRTCService: Respuesta recibida de:", data.from);
                try {
                    await this.handleAnswer(data.answer);
                } catch (error) {
                    console.error('WebRTCService: Error al manejar respuesta recibida:', error);
                    this.closeConnection();
                }
            }
        });

        this.socketService.on(VideoCallEvent.SEND_ICE_CANDIDATE, async (data: ReceivedIceCandidateData) => {
            if (data.from === this.partnerSocketId && this.peerConnection && this.currentCallId) {
                console.log("WebRTCService: Candidato ICE recibido de:", data.from);
                try {
                    await this.handleIceCandidate(data.candidate);
                } catch (error) {
                    console.warn('WebRTCService: Error menor al manejar candidato ICE recibido:', error);
                }
            }
        });

        // Evento que el backend DEBERÍA enviar cuando el otro usuario se desconecta o cuelga
        this.socketService.on('partner_left_call', (data?: { callId?: string }) => {
            if (!this.currentCallId || (data?.callId && data.callId !== this.currentCallId)) return; // Ignorar si no es para esta llamada
            console.log("WebRTCService: El otro usuario ha dejado la llamada.");
            this.closeConnection(); // El método closeConnection se encarga de notificar al hook/UI
        });

        // Este evento es emitido por ESTE cliente cuando cuelga.
        // Si el backend lo retransmite como el mismo evento al otro par, el otro par también lo recibirá.
        // Es mejor que el backend emita 'partner_left_call' al otro.
        this.socketService.on(VideoCallEvent.END_CALL, (data?: { from?: string }) => {
            if (data?.from && data.from === this.partnerSocketId && this.currentCallId) {
                console.log("WebRTCService: Llamada finalizada por el par (recibido evento END_CALL).");
                this.closeConnection();
            }
        });
    }

    public async getUserMedia(): Promise<void> {
        if (this.localStream) {
            if (this.onLocalStreamReady) this.onLocalStreamReady(this.localStream);
            if (this.peerConnection) {
                this.localStream.getTracks().forEach(track => {
                    if (!this.peerConnection!.getSenders().find(s => s.track === track)) {
                        this.peerConnection!.addTrack(track, this.localStream!);
                    }
                });
            }
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.localStream = stream;
            console.log("WebRTCService: Stream local obtenido.");
            if (this.onLocalStreamReady) this.onLocalStreamReady(this.localStream);
            if (this.peerConnection) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection!.addTrack(track, this.localStream!);
                });
                console.log("WebRTCService: Tracks locales añadidos al PeerConnection.");
            }
        } catch (error) {
            console.error('WebRTCService: Error al obtener getUserMedia:', error);
            throw error;
        }
    }

    private async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error('WebRTCService: PC no inicializado (createOffer)');
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) throw new Error('WebRTCService: PC no inicializado (handleOffer)');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    }

    private async createAnswer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error('WebRTCService: PC no inicializado (createAnswer)');
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) throw new Error('WebRTCService: PC no inicializado (handleAnswer)');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) return;
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.warn('WebRTCService: Error añadiendo candidato ICE:', error);
        }
    }

    public joinQueue(userId: string): void {
        this.closeConnection(); // Limpieza completa antes de unirse a una nueva búsqueda
        console.log("WebRTCService: Usuario uniéndose a la cola:", userId);
        this.socketService.emit(VideoCallEvent.ADD_TO_QUEUE, { user_id: userId });
    }

    public leaveQueue(): void {
        console.log("WebRTCService: Usuario abandonando la cola.");
        this.socketService.emit(VideoCallEvent.LEAVE_QUEUE, {});
        this.closeConnection();
    }

    public endCall(): void {
        console.log("WebRTCService: Solicitando finalizar llamada...");
        this.closeConnectionInternals(true); // Notificar al par
        if (this.onCallEndedByService) { // Asegurar que la UI sepa inmediatamente
            this.onCallEndedByService();
        }
        // Resetear estado en el método público closeConnection, llamado por onCallEndedByService
    }

    private closeConnectionInternals(notifyPartner: boolean): void {
        console.log(`WebRTCService: Cerrando conexión interna. Notificar: ${notifyPartner}. CallID: ${this.currentCallId}, Partner: ${this.partnerSocketId}`);
        if (notifyPartner && this.partnerSocketId && this.currentCallId) {
            this.socketService.emit(VideoCallEvent.END_CALL, {
                to: this.partnerSocketId,
                // from: this.socketService.getSocketId(), // El backend lo sabe
                // call_id: this.currentCallId // El backend podría necesitarlo para identificar la llamada a terminar en BD
            });
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
            if (this.onLocalStreamReady) this.onLocalStreamReady(null);
        }
        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null;
            this.peerConnection.ontrack = null;
            this.peerConnection.oniceconnectionstatechange = null;
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.remoteStream = null;
        if (this.onRemoteStreamArrived) this.onRemoteStreamArrived(null);
    }

    public closeConnection(): void {
        this.closeConnectionInternals(false);
        if (this.onCallEndedByService) {
            this.onCallEndedByService();
        }
        this.currentCallId = null;
        this.partnerSocketId = null;
        this.partnerDBId = null;
        this.isInitiator = false;
        console.log("WebRTCService: Estado interno reseteado en closeConnection.");
    }

    public getPartnerDBId(): string | null {
        return this.partnerDBId;
    }
}

export default WebRTCService;