import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import WebRTCService from '~/services/webrtc.service';
import SocketService from '~/services/socket.service';
import { VideoCallEvent, VideoCallState, QueueResult, MatchFoundData } from '~/types/videocall.types';

const initialState: VideoCallState = {
    isCallActive: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isConnecting: false,
    error: null,
    callDuration: 0,
    inQueue: false,
    callId: null,
};

export function useVideoCall() {
    const { user, token } = useAuth(); // Asumo que user tiene 'id' (user_id de tu BD) y 'token'
    const [state, setState] = useState<VideoCallState>(initialState);
    const [localStreamForUI, setLocalStreamForUI] = useState<MediaStream | null>(null);
    const [remoteStreamForUI, setRemoteStreamForUI] = useState<MediaStream | null>(null);
    const [partnerInfo, setPartnerInfo] = useState<{ dbId: string | null, socketId: string | null }>({ dbId: null, socketId: null });

    // Lazy initialization: Solo obtener instancias cuando estamos en el cliente
    // Usar useMemo para mantener las mismas instancias durante el ciclo de vida del componente
    const webRTCService = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return WebRTCService.getInstance();
    }, []);

    const socketService = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return SocketService.getInstance();
    }, []);

    useEffect(() => {
        if (!webRTCService || !socketService || !token) return;

        // Función async para manejar la conexión
        const initializeConnection = async () => {
            if (!socketService.isConnected()) {
                await socketService.connect(token);
            }

            webRTCService.initializeService(token); // Debe llamarse después de conectar el socket o manejar la conexión asíncrona

            webRTCService.setUICallbacks(
                (stream) => { setRemoteStreamForUI(stream); },
                () => {
                    setState(initialState);
                    setLocalStreamForUI(null);
                    setRemoteStreamForUI(null);
                    setPartnerInfo({ dbId: null, socketId: null });
                    console.log("Hook: Llamada finalizada, estado reseteado.");
                },
                (iceState) => {
                    console.log("Hook: Nuevo estado ICE:", iceState);
                    if (iceState === 'connected' || iceState === 'completed') {
                        setState(prev => ({ ...prev, isCallActive: true, isConnecting: false, error: null, callDuration: 0 }));
                    } else if (iceState === 'failed') {
                        setState(prev => ({ ...prev, isCallActive: false, isConnecting: false, error: "Conexión fallida." }));
                        // WebRTCService.closeConnection() ya se llama internamente y notificará a onCallEndedByService
                    } else if (iceState === 'disconnected' || iceState === 'closed') {
                        if (state.isCallActive) { // Si estaba activa y se desconecta/cierra inesperadamente
                            setState(prev => ({ ...prev, isCallActive: false, isConnecting: false, error: "Llamada desconectada." }));
                        } else if (state.isConnecting) { // Si estaba conectando y falla/cierra
                            setState(prev => ({ ...prev, isConnecting: false, error: "Fallo al conectar." }));
                        }
                    } else if (iceState === 'new' || iceState === 'checking') {
                        setState(prev => ({ ...prev, isConnecting: true, isCallActive: false }));
                    }
                },
                (stream) => {
                    setLocalStreamForUI(stream);
                }
            );
        };

        // Ejecutar la inicialización
        initializeConnection();

        return () => {
            console.log("Hook useVideoCall desmontándose. Llamando a webRTCService.closeConnection()");
            if (webRTCService) {
                webRTCService.closeConnection(); // Limpia la conexión WebRTC
            }
            // No necesariamente desconectar el socket aquí, puede ser global.
        };
    }, [user, token, socketService, webRTCService]);

    useEffect(() => {
        if (!socketService) return;

        const handleQueueResult = (result: QueueResult) => {
            console.log("Hook: QUEUE_RESULT", result);
            setState(prev => ({
                ...prev,
                inQueue: result.success,
                isConnecting: result.success ? true : false, // Si entra a la cola, está intentando conectar
                error: result.success ? null : result.message
            }));
        };

        const handleMatchFound = (data: MatchFoundData & { isInitiator: boolean }) => {
            console.log("Hook: MATCH_FOUND recibido con datos completos:", JSON.stringify(data));
            console.log("isInitiator:", data.isInitiator);
            console.log("callId:", data.call_id); setState(prev => ({
                ...prev,
                isConnecting: true,
                inQueue: false,
                callId: data.call_id,
                error: null
            }));
            setPartnerInfo({ dbId: data.match.id, socketId: data.match.socketId });
        };

        socketService.on(VideoCallEvent.QUEUE_RESULT, handleQueueResult);
        socketService.on(VideoCallEvent.MATCH_FOUND, handleMatchFound);

        return () => {
            socketService.off(VideoCallEvent.QUEUE_RESULT, handleQueueResult);
            socketService.off(VideoCallEvent.MATCH_FOUND, handleMatchFound);
        };
    }, [socketService]);


    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        if (state.isCallActive && !state.isConnecting) {
            intervalId = setInterval(() => {
                setState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
            }, 1000);
        } else {
            if (state.callDuration !== 0) { // Resetear si la llamada no está activa o está conectando
                setState(prev => ({ ...prev, callDuration: 0 }));
            }
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [state.isCallActive, state.isConnecting]);

    const joinQueue = useCallback(async () => {
        if (!user?.user_id || !webRTCService) {
            setState(prev => ({ ...prev, error: "Usuario no autenticado para unirse a la cola." }));
            return;
        }
        console.log("Hook: Solicitando unirse a la cola...");
        setState({
            ...initialState,
            inQueue: true,
            isConnecting: true
        });
        setLocalStreamForUI(null);
        setRemoteStreamForUI(null);
        setPartnerInfo({ dbId: null, socketId: null });
        webRTCService.joinQueue(user.user_id); // Enviar el ID de usuario de la BD
    }, [user, webRTCService]);

    const leaveQueue = useCallback(() => {
        if (!webRTCService) return;
        webRTCService.leaveQueue();
        setState(prev => ({ ...prev, inQueue: false, isConnecting: false }));
    }, [webRTCService]);

    // Implementación futura para llamadas directas.
    const startCall = useCallback(async (targetUserSocketId?: string) => {
        if (!targetUserSocketId) {
            console.warn("startCall invocada sin targetUserSocketId. Para llamadas aleatorias, usa joinQueue.");
            return;
        }
        console.log(`Hook: Intentando iniciar llamada directa a ${targetUserSocketId} (funcionalidad futura).`);
    }, []);

    const endCall = useCallback(() => {
        if (!webRTCService) return;
        webRTCService.endCall();
        // El estado se resetea a través del callback onCallEndedByService desde WebRTCService
    }, [webRTCService]);

    const toggleVideo = useCallback(() => {
        if (!webRTCService) return;
        const stream = webRTCService.getLocalStream();
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
            }
        }
    }, [webRTCService]);

    const toggleAudio = useCallback(() => {
        if (!webRTCService) return;
        const stream = webRTCService.getLocalStream();
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                const newState = !audioTrack.enabled;
                audioTrack.enabled = newState;
                console.log(`🎤 Audio toggled: ${newState ? 'ENABLED' : 'MUTED'}`, {
                    trackId: audioTrack.id,
                    label: audioTrack.label,
                    readyState: audioTrack.readyState,
                    enabled: audioTrack.enabled
                });
                setState(prev => ({ ...prev, isAudioEnabled: newState }));
            } else {
                console.error('❌ No hay audio track disponible');
            }
        } else {
            console.error('❌ No hay stream local disponible');
        }
    }, [webRTCService]);

    return {
        state,
        joinQueue,
        leaveQueue,
        startCall,
        endCall,
        toggleVideo,
        toggleAudio,
        setState,
        localStream: localStreamForUI,
        remoteStream: remoteStreamForUI,
        partnerDBId: partnerInfo.dbId
    };
}