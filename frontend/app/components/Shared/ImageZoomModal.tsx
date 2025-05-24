/**
 * Componente ImageZoomModal
 * 
 * Este componente muestra una imagen en tamaño completo con la posibilidad de hacer zoom.
 * Se utiliza tanto para imágenes de posts como para fotos de perfil.
 * 
 * @module ImageZoomModal
 * @requires react
 * @requires react-icons/fa
 */

import { useState, useEffect } from 'react';
import { FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  maxZoom?: number;
  minZoom?: number;
  zoomStep?: number;
}

export default function ImageZoomModal({
  isOpen,
  onClose,
  imageUrl,
  alt = "Imagen",
  maxZoom = 3,
  minZoom = 1,
  zoomStep = 0.2
}: ImageZoomModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Resetear el zoom y la posición cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
          disabled={zoom <= minZoom}
        >
          <FaSearchMinus />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
          disabled={zoom >= maxZoom}
        >
          <FaSearchPlus />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors ml-2"
        >
          <FaTimes />
        </button>
      </div>

      {/* Contenedor de la imagen */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain transition-transform duration-100"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        />
      </div>
    </div>
  );
} 