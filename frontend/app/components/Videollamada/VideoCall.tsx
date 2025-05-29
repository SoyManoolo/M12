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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-900/50 p-3 rounded-full backdrop-blur-sm">
                <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition-all duration-200 hover:bg-gray-700 ${state.isAudioEnabled
                        ? 'bg-gray-800 text-white hover:text-gray-300'
                        : 'bg-red-600/80 text-white hover:bg-red-700'
                        }`}
                >
                    {state.isAudioEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-all duration-200 hover:bg-gray-700 ${state.isVideoEnabled
                        ? 'bg-gray-800 text-white hover:text-gray-300'
                        : 'bg-red-600/80 text-white hover:bg-red-700'
                        }`}
                >
                    {state.isVideoEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
                </button>

                <button
                    onClick={() => {
                        endCall();
                        onEndCall();
                    }}
                    className="p-3 rounded-full bg-red-600/80 text-white hover:bg-red-700 transition-all duration-200"
                >
                    <FaVideo size={20} />
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