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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      // Aquí iría la lógica para enviar el email de recuperación
      console.log('Enviando email de recuperación a:', email);
      
      // Simulamos un retraso de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('Error al enviar el email de recuperación. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Recuperar Contraseña</h1>
          <p className="text-gray-400">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-gray-900 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Mensajes de estado */}
          {status === 'success' && (
            <div className="p-4 bg-green-900/50 border border-green-800 rounded-lg text-green-400">
              <p>¡Email enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-400">
              <p>{error}</p>
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              status === 'loading'
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {status === 'loading' ? 'Enviando...' : 'Enviar Email'}
          </button>

          {/* Enlace para volver al login */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-blue-500 hover:text-blue-400"
            >
              <FaArrowLeft className="mr-2" />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 