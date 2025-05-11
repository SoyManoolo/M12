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

import { useEffect, useRef } from 'react';
import { FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';
import { useVideoCall } from '~/hooks/useVideoCall';

/**
 * @interface VideoCallProps
 * @description Propiedades del componente VideoCall
 * @property {string} remoteUserId - ID del usuario remoto
 * @property {() => void} onEndCall - Función para finalizar la llamada
 */
interface VideoCallProps {
  remoteUserId: string;
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
export default function VideoCall({ remoteUserId, onEndCall }: VideoCallProps) {
  const {
    state,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    handleError,
    localStream,
    remoteStream
  } = useVideoCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    startCall(remoteUserId);
    return () => {
      endCall();
    };
  }, [remoteUserId]);

  if (!state.isCallActive) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video remoto */}
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Video local */}
      <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Controles */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            state.isAudioEnabled ? 'bg-white text-black' : 'bg-red-600 text-white'
          }`}
        >
          {state.isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            state.isVideoEnabled ? 'bg-white text-black' : 'bg-red-600 text-white'
          }`}
        >
          {state.isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>
        
        <button
          onClick={() => {
            endCall();
            onEndCall();
          }}
          className="p-3 rounded-full bg-red-600 text-white"
        >
          <FaVideo />
        </button>
      </div>

      {/* Indicador de estado */}
      {state.isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
          Conectando...
        </div>
      )}

      {/* Mensaje de error */}
      {state.error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded">
          {state.error}
        </div>
      )}
    </div>
  );
} 