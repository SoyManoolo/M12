/**
 * Componente RatingModal
 * 
 * Este componente representa un modal para calificar la experiencia de videollamada.
 * Incluye:
 * - Selección de calificación (1-5 estrellas)
 * - Campo para comentarios
 * - Botones de acción
 * 
 * @module RatingModal
 * @requires react
 * @requires react-icons/fa
 */

import { useState } from 'react';
import { FaDiamond } from 'react-icons/fa6';

/**
 * Interfaz que define las propiedades del componente RatingModal
 */
interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

/**
 * Componente principal del modal de calificación
 * 
 * @param {RatingModalProps} props - Propiedades del componente
 * @returns {JSX.Element | null} Modal de calificación o null si no está abierto
 */
export default function RatingModal({ isOpen, onClose, onSubmit }: RatingModalProps) {
  // Estados para la calificación y comentarios
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  /**
   * Manejador para establecer la calificación
   * 
   * @param {number} value - Valor de la calificación (1-5)
   */
  const handleRating = (value: number) => {
    setRating(value);
  };

  /**
   * Manejador para enviar la calificación
   */
  const handleSubmit = () => {
    onSubmit(rating, comment);
    setRating(0);
    setComment('');
    onClose();
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Califica la videollamada</h2>
        
        {/* Contenedor de estrellas */}
        <div className="flex justify-center mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className="text-2xl mx-1 focus:outline-none"
            >
              <FaDiamond
                className={star <= rating ? 'text-blue-400' : 'text-gray-400'}
              />
            </button>
          ))}
        </div>

        {/* Campo de comentarios */}
        <textarea
          placeholder="Deja un comentario (opcional)"
          className="w-full h-24 bg-gray-800 rounded-lg p-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
} 