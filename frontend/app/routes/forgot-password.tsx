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

import { Link } from '@remix-run/react';
import { FaArrowLeft } from 'react-icons/fa';

export default function ForgotPassword() {
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
