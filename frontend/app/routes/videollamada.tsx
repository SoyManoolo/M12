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
import { FaVideo, FaArrowRight, FaClock } from 'react-icons/fa';
import ChatVideollamada from '~/components/Videollamada/ChatVideollamada';
import VideoCall from '~/components/Videollamada/VideoCall';
import RatingModal from '~/components/Videollamada/RatingModal';
import { useNavigate, useParams } from '@remix-run/react';
import { redirect } from "@remix-run/node";
import { useVideoCall } from '~/hooks/useVideoCall';
import { VideoCallEvent } from '~/types/videocall.types';
import SocketService from '~/services/socket.service';

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
    handleError,
    localStream,
    remoteStream
  } = useVideoCall();

  const [messages, setMessages] = useState<Message[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [remoteUser, setRemoteUser] = useState<{
    name: string;
    username: string;
    profilePictureUrl: string | null;
  } | null>(null);

  // Iniciar la llamada cuando se monta el componente
  useEffect(() => {
    if (userId) {
      startCall(userId);
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
      to: userId
    });
    
    setMessages(prev => [...prev, newMessage]);
  };

  const handleEndCall = () => {
    endCall();
    setShowRatingModal(true);
  };

  const handleNextCall = () => {
    endCall();
    // Aquí iría la lógica para conectar con la siguiente videollamada
    navigate('/inicio');
  };

  const handleRatingSubmit = (rating: number) => {
    socketService.emit(VideoCallEvent.CALL_RATING, {
      rating,
      to: userId
    });
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
                className="bg-red-600 border border-red-700 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <FaVideo className="text-xl" />
                <span>FINALIZAR VIDEOLLAMADA</span>
              </button>

              <button
                onClick={handleNextCall}
                className="bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <FaArrowRight className="text-xl" />
                <span>SIGUIENTE VIDEOLLAMADA</span>
              </button>

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
              
              {remoteUser && (
                <div className="absolute top-4 left-4">
                  <div className="bg-black bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
                    <p className="text-lg font-semibold">{remoteUser.name}</p>
                    <p className="text-sm text-gray-400">@{remoteUser.username}</p>
                  </div>
                </div>
              )}

              {/* Indicador de estado */}
              {videoCallState.isConnecting && (
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