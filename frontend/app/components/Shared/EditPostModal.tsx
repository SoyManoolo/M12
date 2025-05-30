import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

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
      <div className="bg-gray-900 rounded-lg w-full max-w-lg relative z-10">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Título */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h2>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 