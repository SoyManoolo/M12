/**
 * Componente RatingModal
 *
 * Este componente representa un modal para calificar la experiencia de videollamada.
 * Incluye:
 * - Selección de calificación (1-5 estrellas)
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
  canSubmit: boolean;
  statusMessage?: string | null;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<string | null>;
}

/**
 * Componente principal del modal de calificación
 *
 * @param {RatingModalProps} props - Propiedades del componente
 * @returns {JSX.Element | null} Modal de calificación o null si no está abierto
 */
export default function RatingModal({ isOpen, canSubmit, statusMessage, onClose, onSubmit }: RatingModalProps) {
  // Estado para la calificación y el envío
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const handleSubmit = async () => {
    if (submitting || !canSubmit || rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const message = await onSubmit(rating);
      if (message) {
        setError(message);
      } else {
        setRating(0);
        onClose();
      }
    } catch {
      setError('No se pudo guardar la valoración.');
    } finally {
      setSubmitting(false);
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-page bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
          Califica la videollamada
        </h2>

        {/* Contenedor de estrellas */}
        <div className="flex justify-center mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className="text-2xl mx-1 focus:outline-none"
            >
              <FaDiamond
                className={star <= rating ? 'text-accent' : 'text-muted'}
              />
            </button>
          ))}
        </div>

        {statusMessage && <p role="status" className="text-copy mb-4">{statusMessage}</p>}
        {error && <p role="alert" className="text-red-400 mb-4">{error}</p>}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-hover text-ink rounded-lg hover:bg-hover focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || rating < 1 || submitting}
            className="px-4 py-2 bg-primary-hover text-white rounded-lg hover:bg-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {submitting ? 'Guardando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
