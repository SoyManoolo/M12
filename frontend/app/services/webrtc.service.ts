import { iceServersConfig } from "../config/rtc.config";
import {
    VideoCallEvent,
    MatchFoundData,
    VideoCallOffer,
    VideoCallAnswer,
    VideoCallIceCandidate,
} from "~/types/videocall.types"; // Tus tipos
import SocketService from "./socket.service";

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
    private iceCandidateBuffer: RTCIceCandidateInit[] = [];
    private hasRemoteDescription = false;
    private reconnectionAttempts = 0;
    private readonly MAX_RECONNECTION_ATTEMPTS = 3;
    private connectionTimeout: NodeJS.Timeout | null = null;

    private static instance: WebRTCService;
    public peerConnection: RTCPeerConnection | null = null;
    public localStream: MediaStream | null = null;
    public remoteStream: MediaStream | null = null;
    private socketService: SocketService;
    private token: string | null = null;

    private currentCallId: string | null = null;
    private partnerSocketId: string | null = null;
    private partnerDBId: string | null = null; // Para chat/rating
    private isInitiator: boolean = false;
    private isSignalingSetup: boolean = false;

    // Callbacks para notificar a la UI/hook
    public onRemoteStreamArrived: ((stream: MediaStream | null) => void) | null =
        null;
    public onCallEndedByService: (() => void) | null = null;
    public onConnectionStateChange:
        | ((state: RTCIceConnectionState) => void)
        | null = null;
    public onLocalStreamReady: ((stream: MediaStream | null) => void) | null =
        null;

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

    public initializeService(token?: string): void {
        if (token) {
            this.token = token
        }

        if (this.socketService.isConnected() && !this.isSignalingSetup) {
            this.setupSignalingListeners();
            this.isSignalingSetup = true;
        } else if (!this.socketService.isConnected()) {
            this.socketService.onConnect(() => {
                // Espera a que el socket conecte
                if (!this.isSignalingSetup) {
                    this.setupSignalingListeners();
                    this.isSignalingSetup = true;
                }
            });
        }
    }

    private async processIceCandidateBuffer() {
        if (!this.hasRemoteDescription || !this.peerConnection) {
            return;
        }

        console.log(`WebRTCService: Procesando ${this.iceCandidateBuffer.length} candidatos ICE en buffer`);

        for (const candidate of this.iceCandidateBuffer) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("WebRTCService: Candidato ICE del buffer añadido correctamente");
            } catch (err) {
                console.error("WebRTCService: Error añadiendo candidato ICE del buffer:", err);
            }
        }

        // Vaciar el buffer después de procesar
        this.iceCandidateBuffer = [];
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

        // Reiniciar buffers y estados
        this.iceCandidateBuffer = [];
        this.hasRemoteDescription = false;
        this.reconnectionAttempts = 0;

        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }

        // Configuración mejorada para atravesar NATs complejas
        this.peerConnection = new RTCPeerConnection({
            iceServers: iceServersConfig,
            iceCandidatePoolSize: 10,
            iceTransportPolicy: 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
        } as RTCConfiguration);

        console.log(
            "WebRTCService: RTCPeerConnection inicializado con:",
            iceServersConfig
        );

        // El resto del método permanece igual
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.partnerSocketId && this.currentCallId) {
                console.log("WebRTCService: Candidato generado:",
                    event.candidate.candidate.includes("relay") ? "TURN/RELAY" :
                        event.candidate.candidate.includes("srflx") ? "STUN/SRFLX" :
                            "LOCAL/HOST"
                );

                // Enviar candidato
                this.socketService.emit(VideoCallEvent.SEND_ICE_CANDIDATE, {
                    candidate: event.candidate,
                    from: this.socketService.getSocketId(),
                    to: this.partnerSocketId,
                    token: this.token ?? "",
                });
            } else if (!event.candidate) {
                console.log("WebRTCService: Recopilación de candidatos ICE completada");
            }
        };

        this.peerConnection.ontrack = (event) => {
            console.log("WebRTCService: Track remoto recibido:", {
                kind: event.track.kind,
                enabled: event.track.enabled,
                muted: event.track.muted,
                readyState: event.track.readyState
            });

            this.remoteStream = event.streams[0];
            this.ensureTracksEnabled(this.remoteStream);

            // Monitorear cambios en el track
            event.track.onmute = () => console.log("WebRTCService: Track remoto muteado");
            event.track.onunmute = () => console.log("WebRTCService: Track remoto desmuteado");
            event.track.onended = () => console.log("WebRTCService: Track remoto finalizado");

            if (this.onRemoteStreamArrived) {
                this.onRemoteStreamArrived(this.remoteStream);
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            if (this.peerConnection) {
                const state = this.peerConnection.iceConnectionState;
                console.log(`WebRTCService: ICE Connection State cambiado a: ${state}`);

                if (this.onConnectionStateChange) this.onConnectionStateChange(state);

                if (state === "connected" || state === "completed") {
                    // Asegurar que los tracks están habilitados después de la conexión
                    setTimeout(() => {
                        this.ensureTracksEnabled(this.localStream);
                        this.ensureTracksEnabled(this.remoteStream);
                    }, 1000);

                    if (this.currentCallId) {
                        this.socketService.emit(VideoCallEvent.CALL_CONNECTED, {
                            call_id: this.currentCallId,
                        });
                    }

                    // Limpiamos el timeout si existe
                    if (this.connectionTimeout) {
                        clearTimeout(this.connectionTimeout);
                        this.connectionTimeout = null;
                    }

                    this.reconnectionAttempts = 0; // Reset contador cuando se conecta exitosamente

                } else if (state === "failed") {
                    console.log("WebRTCService: Conexión WebRTC fallida. Cerrando llamada...");
                    this.closeConnection();

                } else if (state === "disconnected") {
                    console.log("WebRTCService: Conexión WebRTC fallida. Cerrando llamada...");
                    this.closeConnection();

                } else if (state === "closed") {
                    this.closeConnectionInternals(false);
                    if (this.onCallEndedByService) this.onCallEndedByService();
                }
            }
        };

        // Monitoreo avanzado para depuración TURN
        this.peerConnection.onconnectionstatechange = () => {
            console.log(`WebRTCService: Connection State: ${this.peerConnection?.connectionState}`);
        };

        this.peerConnection.onsignalingstatechange = () => {
            console.log(`WebRTCService: Signaling State: ${this.peerConnection?.signalingState}`);
        };

        this.peerConnection.onicegatheringstatechange = () => {
            console.log(`WebRTCService: ICE Gathering State: ${this.peerConnection?.iceGatheringState}`);
        };

        this.peerConnection.onicecandidateerror = (event) => {
            console.error("WebRTCService: Error en candidato ICE:", event);
        };

        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection!.addTrack(track, this.localStream!);
            });
        }
        return this.peerConnection;
    }

    private setupSignalingListeners() {
        console.log("WebRTCService: Configurando listeners de señalización...");

        this.socketService.on(
            VideoCallEvent.MATCH_FOUND,
            async (data: MatchFoundData & { isInitiator: boolean }) => {
                console.log("WebRTCService: match_found recibido:", data);
                if (
                    this.currentCallId ||
                    (this.peerConnection &&
                        this.peerConnection.signalingState !== "closed")
                ) {
                    console.warn(
                        "WebRTCService: MATCH_FOUND recibido pero una llamada parece estar activa o en proceso. Limpiando primero."
                    );
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
                        console.log(
                            "WebRTCService: Soy iniciador, creando y enviando oferta..."
                        );
                        const offer = await this.createOffer();
                        const payload: VideoCallOffer = {
                            offer,
                            from: this.socketService.getSocketId()!,
                            to: this.partnerSocketId,
                            token: this.token ?? "",
                        };
                        this.socketService.emit(VideoCallEvent.SEND_OFFER, payload);
                    } else {
                        console.log("WebRTCService: No soy iniciador, esperando oferta.");
                    }
                } catch (error) {
                    console.error("WebRTCService: Error en MATCH_FOUND:", error);
                    this.closeConnection();
                }
            }
        );

        // Escucha el mismo evento que se usa para enviar, asumiendo que el backend
        // reenvía el payload original, pero dirigido a este socket.
        // El backend DEBE añadir/confirmar el campo 'from' con el socketId del emisor original.
        this.socketService.on(
            VideoCallEvent.RECEIVE_OFFER,
            async (data: ReceivedOfferData) => {
                if (
                    !this.isInitiator &&
                    data.from === this.partnerSocketId &&
                    this.currentCallId
                ) {
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
                            token: this.token ?? "",
                        };
                        this.socketService.emit(VideoCallEvent.SEND_ANSWER, payload);
                    } catch (error) {
                        console.error(
                            "WebRTCService: Error al manejar oferta recibida:",
                            error
                        );
                        this.closeConnection();
                    }
                }
            }
        );

        this.socketService.on(
            VideoCallEvent.RECEIVE_ANSWER,
            async (data: ReceivedAnswerData) => {
                if (
                    this.isInitiator &&
                    data.from === this.partnerSocketId &&
                    this.currentCallId
                ) {
                    console.log("WebRTCService: Respuesta recibida de:", data.from);
                    try {
                        await this.handleAnswer(data.answer);
                    } catch (error) {
                        console.error(
                            "WebRTCService: Error al manejar respuesta recibida:",
                            error
                        );
                        this.closeConnection();
                    }
                }
            }
        );

        this.socketService.on(
            VideoCallEvent.RECEIVE_ICE_CANDIDATE,
            async (data: ReceivedIceCandidateData) => {
                if (
                    data.from === this.partnerSocketId &&
                    this.peerConnection &&
                    this.currentCallId
                ) {
                    console.log("WebRTCService: Candidato ICE recibido de:", data.from);
                    try {
                        await this.handleIceCandidate(data.candidate);
                    } catch (error) {
                        console.warn(
                            "WebRTCService: Error menor al manejar candidato ICE recibido:",
                            error
                        );
                    }
                }
            }
        );

        // Evento que el backend DEBERÍA enviar cuando el otro usuario se desconecta o cuelga
        this.socketService.on("partner_left_call", (data?: { callId?: string }) => {
            if (
                !this.currentCallId ||
                (data?.callId && data.callId !== this.currentCallId)
            )
                return; // Ignorar si no es para esta llamada
            console.log("WebRTCService: El otro usuario ha dejado la llamada.");
            this.closeConnection(); // El método closeConnection se encarga de notificar al hook/UI
        });

        // Este evento es emitido por ESTE cliente cuando cuelga.
        // Si el backend lo retransmite como el mismo evento al otro par, el otro par también lo recibirá.
        // Es mejor que el backend emita 'partner_left_call' al otro.
        this.socketService.on(
            VideoCallEvent.END_CALL,
            (data?: { from?: string }) => {
                if (
                    data?.from &&
                    data.from === this.partnerSocketId &&
                    this.currentCallId
                ) {
                    console.log(
                        "WebRTCService: Llamada finalizada por el par (recibido evento END_CALL)."
                    );
                    this.closeConnection();
                }
            }
        );
    }

    public async getUserMedia(): Promise<void> {
        if (this.localStream) {
            console.log("WebRTCService: Stream local ya existente, verificando estado...");
            this.ensureTracksEnabled(this.localStream);

            if (this.onLocalStreamReady) this.onLocalStreamReady(this.localStream);
            if (this.peerConnection) {
                this.localStream.getTracks().forEach((track) => {
                    if (!this.peerConnection!.getSenders().find((s) => s.track === track)) {
                        this.peerConnection!.addTrack(track, this.localStream!);
                    }
                });
            }
            return;
        }

        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: true
            };

            console.log("WebRTCService: Solicitando acceso a medios locales con constraints:", constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Depurar estado de los tracks
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const videoTrack = videoTracks[0];
                console.log("WebRTCService: Stream local obtenido con video track:", {
                    label: videoTrack.label,
                    enabled: videoTrack.enabled,
                    muted: videoTrack.muted,
                    readyState: videoTrack.readyState,
                    settings: videoTrack.getSettings()
                });
            } else {
                console.warn("WebRTCService: Stream local sin tracks de video");
            }

            this.localStream = stream;
            this.ensureTracksEnabled(this.localStream);

            if (this.onLocalStreamReady) this.onLocalStreamReady(this.localStream);

            if (this.peerConnection) {
                this.localStream.getTracks().forEach((track) => {
                    this.peerConnection!.addTrack(track, this.localStream!);
                });
                console.log("WebRTCService: Tracks locales añadidos al PeerConnection.");
            }
        } catch (error) {
            console.error("WebRTCService: Error al obtener getUserMedia:", error);
            throw error;
        }
    }

    private async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection)
            throw new Error("WebRTCService: PC no inicializado (createOffer)");
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection)
            throw new Error("WebRTCService: PC no inicializado (handleOffer)");

        await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
        );

        // Marcar que ya tenemos la descripción remota
        this.hasRemoteDescription = true;

        // Procesar candidatos ICE que pudieran haber llegado antes de la oferta
        await this.processIceCandidateBuffer();
    }

    private async createAnswer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection)
            throw new Error("WebRTCService: PC no inicializado (createAnswer)");
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection)
            throw new Error("WebRTCService: PC no inicializado (handleAnswer)");

        await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
        );

        // Marcar que ya tenemos la descripción remota
        this.hasRemoteDescription = true;

        // Procesar candidatos ICE que pudieran haber llegado antes de la respuesta
        await this.processIceCandidateBuffer();
    }

    private async handleIceCandidate(
        candidate: RTCIceCandidateInit
    ): Promise<void> {
        if (!this.peerConnection) return;

        // Si aún no tenemos una descripción remota, almacenar en buffer
        if (!this.hasRemoteDescription) {
            console.log("WebRTCService: Guardando candidato ICE en buffer");
            this.iceCandidateBuffer.push(candidate);
            return;
        }

        // Si ya tenemos la descripción remota, añadir directamente
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.warn("WebRTCService: Error añadiendo candidato ICE:", error);
        }
    }

    private ensureTracksEnabled(stream: MediaStream | null): void {
        if (!stream) return;

        console.log("WebRTCService: Verificando estado de tracks en stream:", stream.id);

        // Habilitar explícitamente todos los tracks
        stream.getTracks().forEach(track => {
            if (!track.enabled) {
                console.log(`WebRTCService: Habilitando track ${track.kind} que estaba desactivado`);
                track.enabled = true;
            }

            console.log(`WebRTCService: Track ${track.kind} está ${track.enabled ? 'habilitado' : 'deshabilitado'} y ${track.readyState}`);
        });
    }

    public joinQueue(userId: string): void {
        this.closeConnection(); // Limpieza completa antes de unirse a una nueva búsqueda
        console.log("WebRTCService: Usuario uniéndose a la cola:", userId);
        this.socketService.emit(VideoCallEvent.ADD_TO_QUEUE, { user_id: userId, token: this.token });
    }

    public leaveQueue(): void {
        console.log("WebRTCService: Usuario abandonando la cola.");
        this.socketService.emit(VideoCallEvent.LEAVE_QUEUE, {
            token: this.token
        });
        this.closeConnection();
    }

    public endCall(): void {
        console.log("WebRTCService: Solicitando finalizar llamada...");
        this.closeConnectionInternals(true); // Notificar al par
        if (this.onCallEndedByService) {
            // Asegurar que la UI sepa inmediatamente
            this.onCallEndedByService();
        }
        // Resetear estado en el método público closeConnection, llamado por onCallEndedByService
    }

    private closeConnectionInternals(notifyPartner: boolean): void {
        console.log(
            `WebRTCService: Cerrando conexión interna. Notificar: ${notifyPartner}. CallID: ${this.currentCallId}, Partner: ${this.partnerSocketId}`
        );
        if (notifyPartner && this.partnerSocketId && this.currentCallId) {
            this.socketService.emit(VideoCallEvent.END_CALL, {
                to: this.partnerSocketId,
                token: this.token ?? "",
            });
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
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

        // Limpiar estados de buffer y reconexión
        this.iceCandidateBuffer = [];
        this.hasRemoteDescription = false;
        this.reconnectionAttempts = 0;

        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
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