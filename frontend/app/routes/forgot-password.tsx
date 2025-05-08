/**
 * Página de Recuperación de Contraseña
 * 
 * Permite a los usuarios recuperar su contraseña mediante su email.
 * Incluye:
 * - Formulario para ingresar email
 * - Mensajes de estado
 * - Enlace para volver al login
 * 
 * @module ForgotPassword
 */

import { useState } from 'react';
import { Link } from '@remix-run/react';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import { useMessage } from '../hooks/useMessage';
import Message from '../components/Shared/Message';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { message, showMessage, clearMessage } = useMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showMessage('info', 'Enviando email de recuperación...');

    try {
      // Aquí iría la lógica para enviar el email de recuperación
      console.log('Enviando email de recuperación a:', email);
      
      // Simulamos un retraso de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showMessage('success', 'Te hemos enviado un email con las instrucciones para recuperar tu contraseña');
    } catch (err) {
      showMessage('error', 'No pudimos enviar el email de recuperación. Por favor, inténtalo de nuevo');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
        <h1 className="text-4xl text-white text-center mb-8 font-bold tracking-wider">RECUPERAR CONTRASEÑA</h1>
        
        {message && (
          <Message
            type={message.type}
            message={message.text}
            onClose={clearMessage}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              CORREO ELECTRÓNICO
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
                required
                placeholder="Ingresa tu correo electrónico"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors tracking-wider cursor-pointer"
          >
            ENVIAR INSTRUCCIONES
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-gray-400 hover:text-white text-sm tracking-wider"
            >
              <FaArrowLeft className="mr-2" />
              VOLVER A INICIAR SESIÓN
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 