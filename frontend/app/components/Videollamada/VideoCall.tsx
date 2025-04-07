/**
 * @file VideoCall.tsx
 * @description Componente que maneja la funcionalidad de videollamada, incluyendo
 * la visualización del video y los controles de la llamada.
 * 
 * @module VideoCall
 * @exports VideoCall
 * 
 * @requires react
 * @requires react-icons/fa
 */

import { useState } from 'react';
import { FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';

/**
 * @interface VideoCallProps
 * @description Propiedades del componente VideoCall
 * @property {boolean} isActive - Indica si la llamada está activa
 * @property {() => void} onEndCall - Función para finalizar la llamada
 */
interface VideoCallProps {
  isActive: boolean;
  onEndCall: () => void;
}

/**
 * @function VideoCall
 * @description Componente que renderiza la interfaz de videollamada
 * @param {VideoCallProps} props - Propiedades del componente
 * @returns {JSX.Element} Interfaz de videollamada con controles
 * 
 * @state {boolean} isVideoEnabled - Estado del video
 * @state {boolean} isAudioEnabled - Estado del audio
 */
export default function VideoCall({ isActive, onEndCall }: VideoCallProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  /**
   * @function toggleVideo
   * @description Alterna el estado del video
   */
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  /**
   * @function toggleAudio
   * @description Alterna el estado del audio
   */
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video del usuario remoto */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <FaVideo className="text-gray-600 text-6xl" />
        </div>
      </div>

      {/* Video local (pequeño) */}
      <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <FaVideo className="text-gray-600 text-3xl" />
        </div>
      </div>

      {/* Controles */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isAudioEnabled ? 'bg-white text-black' : 'bg-red-600 text-white'
          }`}
        >
          {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoEnabled ? 'bg-white text-black' : 'bg-red-600 text-white'
          }`}
        >
          {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>
        
        <button
          onClick={onEndCall}
          className="p-3 rounded-full bg-red-600 text-white"
        >
          <FaVideo />
        </button>
      </div>
    </div>
  );
} 