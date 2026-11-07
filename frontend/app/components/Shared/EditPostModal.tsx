import { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useAccessibleDialog } from '~/hooks/useAccessibleDialog';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (description: string) => void;
  currentDescription: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function EditPostModal({
  isOpen,
  onClose,
  onConfirm,
  currentDescription,
  title = "Editar publicación",
  confirmText = "Guardar",
  cancelText = "Cancelar"
}: EditPostModalProps) {
  const [description, setDescription] = useState(currentDescription);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useAccessibleDialog(isOpen, dialogRef, onClose, closeButtonRef);

  useEffect(() => {
    setDescription(currentDescription);
  }, [currentDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(description);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay con efecto blur */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="edit-post-modal-title" className="bg-surface rounded-lg w-full max-w-lg relative z-10">
        {/* Botón de cerrar */}
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Cerrar edición de publicación"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Título */}
        <div className="p-6 border-b border-line">
          <h2 id="edit-post-modal-title" className="text-xl font-bold text-center bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            {title}
          </h2>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-copy mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full px-3 py-2 bg-soft border border-line rounded-lg text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe una descripción..."
              autoFocus
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-copy hover:text-ink transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
