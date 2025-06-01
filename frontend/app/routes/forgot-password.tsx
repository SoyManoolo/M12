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
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl text-white text-center mb-6 font-bold tracking-wider">RECUPERAR CONTRASEÑA</h1>
        <div className="flex flex-col items-center justify-center">
          <span className="text-6xl mb-4">🚧</span>
          <p className="text-lg text-gray-300 text-center mb-2 font-semibold">Esta opción está en mantenimiento</p>
          <p className="text-gray-400 text-center mb-6">La recuperación de contraseña estará disponible próximamente.<br />¡Gracias por tu paciencia!</p>
          <Link
            to="/login"
            className="inline-flex items-center text-blue-400 hover:text-white text-base tracking-wider border border-blue-600 rounded-lg px-4 py-2 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            VOLVER A INICIAR SESIÓN
          </Link>
        </div>
      </div>
    </div>
  );
} 