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

import { useRef } from 'react';
import SecureImage from './SecureImage';
import { useAccessibleDialog } from '~/hooks/useAccessibleDialog';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export default function ImageZoomModal({ isOpen, onClose, imageUrl, alt }: ImageZoomModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useAccessibleDialog(isOpen, dialogRef, onClose, closeButtonRef);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button 
        ref={closeButtonRef}
        type="button"
        aria-label="Cerrar imagen ampliada"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
      >
        ×
      </button>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={alt} className="relative max-w-[90vw] max-h-[90vh] w-auto h-auto" onClick={e => e.stopPropagation()}>
        <SecureImage
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
        />
      </div>
    </div>
  );
} 
