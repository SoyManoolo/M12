/**
 * Componente ChatVideollamada
 * 
 * Este componente representa el chat durante una videollamada.
 * Incluye:
 * - Lista de mensajes
 * - Campo para enviar nuevos mensajes
 * - Indicadores de estado de mensajes
 * 
 * @module ChatVideollamada
 * @requires react
 * @requires react-icons/fa
 */

import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

/**
 * Interfaz que define la estructura de un mensaje
 */
interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

/**
 * Interfaz que define las propiedades del componente ChatVideollamada
 */
interface ChatVideollamadaProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
}

/**
 * Componente principal del chat de videollamada
 * 
 * @param {ChatVideollamadaProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de chat con funcionalidades de mensajería
 */
export default function ChatVideollamada({ messages, onSendMessage }: ChatVideollamadaProps) {
  // Estado para el mensaje actual
  const [newMessage, setNewMessage] = useState('');

  /**
   * Manejador para enviar un nuevo mensaje
   */
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  /**
   * Manejador para la tecla Enter
   * 
   * @param {React.KeyboardEvent<HTMLInputElement>} e - Evento de teclado
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg">
      {/* Contenedor de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg p-3 ${
                message.isOwn
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Contenedor de entrada de mensajes */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
} 