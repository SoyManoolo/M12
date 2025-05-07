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
import { useNavigate } from '@remix-run/react';
import { redirect } from "@remix-run/node";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '¡Hola! ¿Cómo estás?',
      sender: 'Usuario1',
      timestamp: '2024-03-31T12:00:00Z',
      isOwn: false
    },
    {
      id: '2',
      content: '¡Hola! Todo bien, ¿y tú?',
      sender: 'Usuario2',
      timestamp: '2024-03-31T12:01:00Z',
      isOwn: true
    }
  ]);

  const [isCallActive, setIsCallActive] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Iniciar el contador cuando se monta el componente
  useEffect(() => {
    setIsCallActive(true);
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Función para formatear el tiempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * @function handleSendMessage
   * @description Maneja el envío de un nuevo mensaje
   * @param {string} content - Contenido del mensaje
   */
  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'Usuario2',
      timestamp: new Date().toISOString(),
      isOwn: true
    };
    setMessages(prev => [...prev, newMessage]);
  };

  /**
   * @function handleEndCall
   * @description Maneja la finalización de la llamada
   */
  const handleEndCall = () => {
    setIsCallActive(false);
    setShowRatingModal(true);
  };

  const handleNextCall = () => {
    setIsCallActive(false);
    // Aquí iría la lógica para conectar con la siguiente videollamada
    // Por ahora solo reiniciamos el contador
    setCallDuration(0);
    setMessages([]);
    setIsCallActive(true);
  };

  const handleRatingSubmit = (rating: number) => {
    // Aquí iría la lógica para guardar la valoración
    console.log('Rating submitted:', rating);
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
                <span className="font-mono text-lg">{formatTime(callDuration)}</span>
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

              {/* Nuestra cámara (pequeña) */}
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                  {/* Aquí irá el componente de video de nuestra cámara */}
                  <div className="absolute bottom-2 left-2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    NUESTRA CÁMARA
                  </div>
                </div>
              </div>
            </div>

            {/* Center section - Main video */}
            <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden relative">
              {/* Aquí irá el componente de video de la otra persona */}
              <div className="absolute top-4 left-4">
                <div className="bg-black bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
                  <p className="text-lg font-semibold">María García</p>
                  <p className="text-sm text-gray-400">@mariagarcia</p>
                </div>
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