import React, { useRef, useEffect } from 'react';
import { developmentLogger } from '~/utils/logger';

interface DebugVideoProps {
    stream: MediaStream | null;
    type: 'local' | 'remote';
    className?: string;
}

export const DebugVideo: React.FC<DebugVideoProps> = ({ stream, type, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            const video = videoRef.current;
            video.srcObject = stream;

            // Gestionar errores de reproducción
            video.onplay = () => {
                developmentLogger.info(`Video ${type} reproducción iniciada`);
            };

            video.onloadedmetadata = () => {
                developmentLogger.info(`Video ${type} metadata cargada:`, {
                    width: video.videoWidth,
                    height: video.videoHeight
                });
                video.play()
                    .then(() => developmentLogger.info(`Video ${type} play() exitoso`))
                    .catch(err => developmentLogger.error(`Error al reproducir video ${type}:`, err));
            };

            video.onerror = () => {
                developmentLogger.error(`Error en video ${type}:`, video.error);
            };
        } else if (!stream) {
            developmentLogger.info(`Stream ${type} no disponible`);
        }
    }, [stream, type]);

    return (
        <div className="video-debug-container">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={type === 'local'} // Solo silenciar el video local
                className={className || "w-full h-full object-cover"}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};
