import { useState, useEffect } from 'react';
import { FaVideo, FaArrowRight, FaClock } from 'react-icons/fa';
import ChatVideollamada from '~/components/Videollamada/ChatVideollamada';
import { useNavigate } from '@remix-run/react';

export default function VideoLlamadaPage() {
  const navigate = useNavigate();
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    sender: string;
    timestamp: string;
  }>>([]);

  // Iniciar el contador cuando se monta el componente
  useEffect(() => {
    setIsInCall(true);
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

  const handleSendMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleExitCall = () => {
    setIsInCall(false);
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
                onClick={handleExitCall}
                className="bg-red-600 border border-red-700 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <FaVideo className="text-xl" />
                <span>SALIR VIDEOLLAMADA</span>
              </button>

              <button
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
    </div>
  );
} 