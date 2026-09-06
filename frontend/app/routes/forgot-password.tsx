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

import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import { authService } from '~/services/auth.service';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const result = await authService.requestPasswordReset(email);
    setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
          <FaEnvelope className="text-2xl" />
        </div>
        <h1 className="text-2xl sm:text-3xl text-white text-center mb-3 font-bold tracking-wide">RECUPERAR CONTRASEÑA</h1>
        <p className="text-gray-400 text-center mb-6">Escribe el correo asociado a tu cuenta y te enviaremos las instrucciones.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          {message && <p role="status" className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>{message.text}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'ENVIANDO…' : 'ENVIAR INSTRUCCIONES'}
          </button>
        </form>
        <div className="mt-6 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center text-blue-400 hover:text-white text-sm tracking-wide transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            VOLVER A INICIAR SESIÓN
          </Link>
        </div>
      </div>
    </div>
  );
} 
