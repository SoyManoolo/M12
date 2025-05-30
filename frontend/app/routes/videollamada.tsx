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

import { useState, useEffect } from 'react';
import { FaVideo, FaArrowRight, FaClock, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaSearch } from 'react-icons/fa';
import ChatVideollamada from '~/components/Videollamada/ChatVideollamada';
import { useNavigate, useParams } from '@remix-run/react';
import { redirect } from "@remix-run/node";
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
 * @interface RemoteUser
 * @description Define la estructura de un usuario remoto
 * @property {string} name - Nombre del usuario
 * @property {string} username - Nombre de usuario
 * @property {string | null} profilePictureUrl - URL de la imagen de perfil del usuario
 */
interface RemoteUser {
    name: string;
    username: string;
    profilePictureUrl: string | null;
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
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-[1920px] mx-auto h-[calc(100vh-4rem)]">
                <div className="flex flex-col h-full">
                    {/* Main content */}
                    <div className="flex-1 flex gap-6">
                        {/* Left section - Controls */}
                        <div className="w-1/4 flex flex-col gap-4">
                            {/* Contador de tiempo */}
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center justify-center gap-2">
                                <FaClock className="text-gray-400" />
                                <span className="font-mono text-lg">{formatTime(videoCallState.callDuration)}</span>
                            </div>

                            <button
                                onClick={handleEndCall}
                                className={`bg-red-600 border border-red-700 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${!videoCallState.isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!videoCallState.isCallActive}
                            >
                                <FaVideo className="text-xl" />
                                <span>FINALIZAR VIDEOLLAMADA</span>
                            </button>
                            
                            {/* Fila con dos botones */}
                            <div className="flex gap-2">
                                {/* MODIFICADO: Botón de buscar/cancelar llamada */}
                                <button
                                    onClick={handleSearchCall}
                                    className={`flex-1 ${videoCallState.inQueue 
                                        ? 'bg-orange-600 border border-orange-700 hover:bg-orange-700' 
                                        : 'bg-blue-600 border border-blue-700 hover:bg-blue-700'} 
                                        text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors 
                                        ${videoCallState.isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={videoCallState.isCallActive}
                                >
                                    <FaSearch className="text-xl" />
                                    <span>{videoCallState.inQueue ? 'CANCELAR' : 'BUSCAR'}</span>
                                </button>

                                {/* MODIFICADO: Botón de siguiente llamada */}
                                <button
                                    onClick={handleNextCall}
                                    className={`flex-1 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${!videoCallState.isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!videoCallState.isCallActive}
                                >
                                    <FaArrowRight className="text-xl" />
                                    <span>SIGUIENTE</span>
                                </button>
                            </div>

                            {/* Video local */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                                    <video
                                        ref={video => {
                                            if (video && localStream) {
                                                video.srcObject = localStream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-2 left-2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                        TU CÁMARA
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Center section - Main video */}
                        <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden relative">
                            <video
                                ref={video => {
                                    if (video && remoteStream) {
                                        video.srcObject = remoteStream;
                                    }
                                }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

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

                            {/* Controles de video/audio */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-900/50 p-3 rounded-full backdrop-blur-sm">
                                <button
                                    onClick={toggleAudio}
                                    className={`p-3 rounded-full transition-all duration-200 hover:bg-gray-700 ${videoCallState.isAudioEnabled
                                            ? 'bg-gray-800 text-white hover:text-gray-300'
                                            : 'bg-red-600/80 text-white hover:bg-red-700'
                                        }`}
                                >
                                    {videoCallState.isAudioEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`p-3 rounded-full transition-all duration-200 hover:bg-gray-700 ${videoCallState.isVideoEnabled
                                            ? 'bg-gray-800 text-white hover:text-gray-300'
                                            : 'bg-red-600/80 text-white hover:bg-red-700'
                                        }`}
                                >
                                    {videoCallState.isVideoEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Right section - Chat */}
                        <div className="w-1/4">
                            <ChatVideollamada
                                messages={messages}
                                onSendMessage={handleSendMessage}
                            />
                        </div>
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

export const loader = async ({ request }: { request: Request }) => {
    const cookieHeader = request.headers.get("Cookie");
    const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token="))?.split("=")[1];
    if (!token) return redirect("/login");
    return null;
};