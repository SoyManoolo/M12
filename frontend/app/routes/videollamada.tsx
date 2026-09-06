/**
 * @file videollamada.tsx
 * @description Componente principal de videollamada que integra el chat y la funcionalidad
 * de llamada. Permite la comunicación en tiempo real entre usuarios.
 * 
 * @module VideollamadaPage
 * @exports VideollamadaPage
 * 
 * @requires react
 * @requires ~/components/Videollamada/ChatVideollamada
 * @requires ~/components/Videollamada/VideoCall
 */

import { useState, useEffect, useRef } from 'react';
import { FaVideo, FaArrowRight, FaClock, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaSearch, FaHome } from 'react-icons/fa';
import ChatVideollamada from '~/components/Videollamada/ChatVideollamada';
import { useNavigate, useParams } from 'react-router';
import { useVideoCall } from '~/hooks/useVideoCall';
import { VideoCallEvent } from '~/types/videocall.types';
import SocketService from '~/services/socket.service';
import RatingModal from '~/components/Videollamada/RatingModal';

/**
 * @interface Message
 * @description Define la estructura de un mensaje en el chat
 * @property {string} id - Identificador único del mensaje
 * @property {string} content - Contenido del mensaje
 * @property {string} sender - Nombre del remitente
 * @property {string} timestamp - Fecha y hora del mensaje
 * @property {boolean} isOwn - Indica si el mensaje es del usuario actual
 */
interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: string;
    isOwn: boolean;
}

/**
 * @function VideollamadaPage
 * @description Componente principal que integra el chat y la videollamada
 * @returns {JSX.Element} Interfaz de videollamada con chat
 * 
 * @state {Message[]} messages - Lista de mensajes del chat
 * @state {boolean} isCallActive - Estado de la llamada
 */
export default function VideollamadaPage() {
    const navigate = useNavigate();
    const { userId } = useParams();
    const socketService = SocketService.getInstance();
    const {
        state: videoCallState,
        startCall,
        endCall,
        toggleVideo,
        toggleAudio,
        localStream,
        remoteStream,
        joinQueue,
        leaveQueue
    } = useVideoCall();

    const [messages, setMessages] = useState<Message[]>([]);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [debugMessage, setDebugMessage] = useState<string>('');

    // Referencias para los elementos de video
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Mostrar mensaje de debug temporal
    const showDebug = (msg: string) => {
        setDebugMessage(msg);
        setTimeout(() => setDebugMessage(''), 2000);
    };

    // Actualizar el video local cuando cambie el stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Actualizar el video remoto cuando cambie el stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Iniciar la llamada cuando se monta el componente
    useEffect(() => {
        if (userId) {
            startCall();
        }
        return () => {
            endCall();
        };
    }, [userId]);

    // Escuchar eventos de chat
    useEffect(() => {
        socketService.on(VideoCallEvent.CHAT_MESSAGE, (message: Message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socketService.off(VideoCallEvent.CHAT_MESSAGE);
        };
    }, []);

    // Función para formatear el tiempo
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = (content: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            content,
            sender: 'Tú',
            timestamp: new Date().toISOString(),
            isOwn: true
        };

        socketService.emit(VideoCallEvent.CHAT_MESSAGE, {
            ...newMessage,
            to: videoCallState.callId || userId
        });

        setMessages(prev => [...prev, newMessage]);
    };

    // MODIFICADO: Ahora termina la llamada y muestra el modal de calificación
    const handleEndCall = () => {
        if (videoCallState.isCallActive) {
            endCall();
            setShowRatingModal(true);
        }
    };

    // MODIFICADO: Ahora termina la llamada y busca una nueva
    const handleNextCall = () => {
        if (videoCallState.isCallActive) {
            endCall();
            handleSearchCall();
        }
    };

    // MODIFICADO: Ahora implementa correctamente la lógica de búsqueda
    const handleSearchCall = () => {
        console.log("Buscando nueva videollamada...");
        if (videoCallState.inQueue) {
            // Si ya está en cola, salir de la cola
            leaveQueue();
        } else {
            // Si no está en cola, unirse a la cola
            joinQueue();
        }
    };

    // MODIFICADO: Ahora envía la calificación con el ID correcto
    const handleRatingSubmit = (rating: number) => {
        if (videoCallState.callId) {
            socketService.emit(VideoCallEvent.CALL_RATING, {
                rating,
                to: videoCallState.callId,
                callId: videoCallState.callId
            });
        }
        navigate('/inicio');
    };


    return (
        <div className="h-screen w-screen bg-black text-white overflow-hidden fixed inset-0">
            <div className="h-full w-full flex flex-col">
                {/* Container: En móvil ocupará 100% altura dividida en secciones */}
                <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 min-h-0 h-full overflow-hidden">
                    {/* Left section - Controls - En móvil: altura fija pequeña, en PC: sidebar */}
                    <div className="h-auto md:h-full md:w-1/4 flex flex-col gap-2 flex-shrink-0">
                        {/* Fila que contiene el botón Inicio y el contador de tiempo */}
                        <div className="flex gap-2 flex-shrink-0">
                            {/* Botón Volver a Inicio al lado izquierdo del contador */}
                            <button
                                onClick={() => navigate('/inicio')}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-2 md:px-3 rounded-lg flex items-center justify-center gap-1 md:gap-2 transition-colors text-xs md:text-sm"
                            >
                                <FaHome className="text-sm md:text-base" />
                                <span className="hidden sm:inline">INICIO</span>
                            </button>

                            {/* Contador de tiempo */}
                            <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 flex items-center justify-center gap-1 md:gap-2">
                                <FaClock className="text-gray-400 text-xs md:text-sm" />
                                <span className="font-mono text-xs md:text-sm">{formatTime(videoCallState.callDuration)}</span>
                            </div>
                        </div>

                        {/* REORDENADO: Fila con dos botones */}
                        <div className="flex gap-2 flex-shrink-0">
                            {/* MODIFICADO: Botón de buscar/cancelar llamada */}
                            <button
                                onClick={handleSearchCall}
                                className={`flex-1 ${videoCallState.inQueue
                                    ? 'bg-orange-600 border border-orange-700 hover:bg-orange-700'
                                    : 'bg-blue-600 border border-blue-700 hover:bg-blue-700'} 
                                text-white font-bold py-2 px-2 md:px-3 rounded-lg flex items-center justify-center gap-1 md:gap-2 cursor-pointer transition-colors text-xs md:text-sm
                                ${videoCallState.isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={videoCallState.isCallActive}
                            >
                                <FaSearch className="text-sm md:text-base" />
                                <span className="hidden sm:inline">{videoCallState.inQueue ? 'CANCELAR' : 'BUSCAR'}</span>
                            </button>

                            {/* MODIFICADO: Botón de siguiente llamada */}
                            <button
                                onClick={handleNextCall}
                                className={`flex-1 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-2 md:px-3 rounded-lg flex items-center justify-center gap-1 md:gap-2 cursor-pointer transition-colors text-xs md:text-sm ${!videoCallState.isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!videoCallState.isCallActive}
                            >
                                <FaArrowRight className="text-sm md:text-base" />
                                <span className="hidden sm:inline">SIGUIENTE</span>
                            </button>
                        </div>

                        {/* REORDENADO: Botón de finalizar llamada */}
                        <button
                            onClick={handleEndCall}
                            className={`bg-red-600 border border-red-700 hover:bg-red-700 text-white font-bold py-2 px-2 md:px-4 rounded-lg flex items-center justify-center gap-1 md:gap-2 cursor-pointer transition-colors text-xs md:text-sm flex-shrink-0 ${!videoCallState.isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!videoCallState.isCallActive}
                        >
                            <FaVideo className="text-sm md:text-base" />
                            <span className="hidden sm:inline">FINALIZAR VIDEOLLAMADA</span>
                            <span className="sm:hidden">FINALIZAR</span>
                        </button>

                        {/* Video local - OCULTO EN MÓVIL para ahorrar espacio */}
                        <div className="hidden md:flex flex-1 relative min-h-0 overflow-hidden">
                            <div className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        disablePictureInPicture
                                        controls={false}
                                        className="w-full h-full object-cover"
                                        style={{ 
                                            WebkitTransform: 'translateZ(0)',
                                            transform: 'translateZ(0)',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden'
                                        }}
                                    />
                                    <div className="absolute bottom-2 left-2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                        TU CÁMARA
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Center section - Main video - En móvil: ocupa el resto del espacio disponible */}
                    <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden relative">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                disablePictureInPicture
                                controls={false}
                                className="w-full h-full object-cover"
                                style={{ 
                                    WebkitTransform: 'translateZ(0)',
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden'
                                }}
                            />

                            {/* Video local en esquina superior derecha - VISIBLE EN MÓVIL como PiP */}
                            <div className="md:hidden absolute top-4 right-4 w-24 h-32 rounded-lg overflow-hidden border-2 border-white shadow-lg z-40">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    disablePictureInPicture
                                    controls={false}
                                    className="w-full h-full object-cover"
                                    style={{ 
                                        WebkitTransform: 'translateZ(0)',
                                        transform: 'translateZ(0)',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden'
                                    }}
                                />
                            </div>

                            {/* MODIFICADO: Indicador de búsqueda */}
                            {videoCallState.inQueue && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75">
                                    <div className="mb-6 animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                                    <h2 className="text-2xl font-bold mb-2">Buscando videollamada...</h2>
                                    <p className="text-gray-400 max-w-md text-center">
                                        Estamos buscando a otro usuario para conectarte. Por favor, espera un momento.
                                    </p>
                                </div>
                            )}

                            {/* Indicador de estado */}
                            {videoCallState.isConnecting && !videoCallState.inQueue && (
                                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                                    Conectando...
                                </div>
                            )}

                            {/* Mensaje de error */}
                            {videoCallState.error && (
                                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded">
                                    {videoCallState.error}
                                </div>
                            )}

                            {/* Debug message - Feedback visual para móvil */}
                            {debugMessage && (
                                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-lg animate-pulse z-50">
                                    {debugMessage}
                                </div>
                            )}

                            {/* Controles de video/audio - Posicionados más arriba del borde inferior */}
                            <div className="absolute bottom-28 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 md:gap-4 bg-gray-900/80 p-4 md:p-3 rounded-full backdrop-blur-sm z-50">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const willMute = videoCallState.isAudioEnabled;
                                        toggleAudio();
                                        showDebug(willMute ? '🔇 MUTEADO' : '🎤 SONIDO ON');
                                    }}
                                    className={`w-14 h-14 md:w-12 md:h-12 rounded-full transition-all duration-200 hover:bg-gray-700 flex items-center justify-center ${videoCallState.isAudioEnabled
                                        ? 'bg-gray-800 text-white hover:text-gray-300'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    style={{ touchAction: 'manipulation' }}
                                >
                                    {videoCallState.isAudioEnabled ? <FaMicrophone className="text-2xl md:text-xl" /> : <FaMicrophoneSlash className="text-2xl md:text-xl" />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleVideo();
                                        showDebug(videoCallState.isVideoEnabled ? '📹 OFF' : '📹 ON');
                                    }}
                                    className={`w-14 h-14 md:w-12 md:h-12 rounded-full transition-all duration-200 hover:bg-gray-700 flex items-center justify-center ${videoCallState.isVideoEnabled
                                        ? 'bg-gray-800 text-white hover:text-gray-300'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    style={{ touchAction: 'manipulation' }}
                                >
                                    {videoCallState.isVideoEnabled ? <FaVideo className="text-2xl md:text-xl" /> : <FaVideoSlash className="text-2xl md:text-xl" />}
                            </button>
                        </div>
                    </div>

                    {/* Right section - Chat - OCULTO EN MÓVIL (solo visible en desktop md:) */}
                    <div className="hidden md:block md:w-1/4 min-h-0 max-h-full overflow-hidden">
                        <ChatVideollamada
                            messages={messages}
                            onSendMessage={handleSendMessage}
                        />
                    </div>
                </div>
            </div>

            <RatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmit={handleRatingSubmit}
            />
        </div>
    );
}
