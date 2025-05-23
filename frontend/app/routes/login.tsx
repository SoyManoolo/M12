/**
 * @file login.tsx
 * @description Componente de página de inicio de sesión que maneja la autenticación de usuarios.
 * Permite el inicio de sesión con credenciales (email/usuario y contraseña) y opciones
 * de inicio de sesión social (Google y Facebook).
 * 
 * @module LoginPage
 * @exports LoginPage
 * 
 * @requires react
 * @requires @remix-run/react
 * @requires @remix-run/node
 * @requires ~/services/auth.service
 */

import { useState } from 'react';
import { Form, useNavigate, Link } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authService } from '../services/auth.service';

/**
 * @function action
 * @description Función del servidor que maneja el envío del formulario de inicio de sesión
 * @param {Object} request - Objeto de solicitud HTTP
 * @returns {Promise<Response>} Redirección a la página de inicio o de error
 */
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const identifier = formData.get('identifier') as string;
  const password = formData.get('password') as string;

  try {
    const response = await authService.login({ identifier, password });
    
    if (response.success && response.token) {
      return redirect('/inicio', {
        headers: {
          'Set-Cookie': `token=${response.token}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
    } else {
      return redirect('/login?error=' + encodeURIComponent(response.message || 'Error al iniciar sesión'));
    }
  } catch (error) {
    return redirect('/login?error=' + encodeURIComponent('Error al conectar con el servidor'));
  }
};

/**
 * @function LoginPage
 * @description Componente principal de la página de inicio de sesión
 * @returns {JSX.Element} Formulario de inicio de sesión con opciones de autenticación
 * 
 * @state {string} identifier - Estado para el email o nombre de usuario
 * @state {string} password - Estado para la contraseña
 * @state {string} error - Estado para mensajes de error
 * 
 * @method handleSubmit - Maneja el envío del formulario de inicio de sesión
 * @method handleGoogleLogin - Maneja el inicio de sesión con Google (pendiente)
 * @method handleFacebookLogin - Maneja el inicio de sesión con Facebook (pendiente)
 */
export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario de inicio de sesión
   * @param {React.FormEvent} e - Evento del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('📤 Datos enviados al backend:', { identifier, password: '****' });
    console.log('🔄 Iniciando proceso de login...');

    try {
      const response = await authService.login({ identifier, password });
      console.log('📥 Respuesta del backend:', response);
      
      if (response.success && response.token) {
        console.log('✅ Login exitoso, token recibido');
        localStorage.setItem('token', response.token);
        navigate('/inicio');
      } else {
        console.log('❌ Error en el login:', response.message);
        setError(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('⚠️ Error al conectar con el servidor:', error);
      setError('Error al conectar con el servidor');
    }
  };

  /**
   * @function handleGoogleLogin
   * @description Maneja el inicio de sesión con Google (pendiente de implementación)
   */
  const handleGoogleLogin = () => {
    console.log('🔵 Iniciando login con Google...');
    // Implementar login con Google
    navigate('/inicio');
  };

  /**
   * @function handleFacebookLogin
   * @description Maneja el inicio de sesión con Facebook (pendiente de implementación)
   */
  const handleFacebookLogin = () => {
    console.log('🔵 Iniciando login con Facebook...');
    // Implementar login con Facebook
    navigate('/inicio');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
        <h1 className="text-4xl text-white text-center mb-8 font-bold tracking-wider">LOG IN</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <Form method="post" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              EMAIL O USUARIO
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
              required
              placeholder="Ingresa tu email o nombre de usuario"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
              required
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-gray-400 hover:text-white tracking-wider cursor-pointer">
              FORGOT PASSWORD?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors tracking-wider cursor-pointer"
          >
            LOG IN
          </button>

          <div className="mt-6">
            <p className="text-gray-400 text-center mb-4 tracking-wider">LOG IN WITH:</p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="text-white hover:text-gray-300 tracking-wider cursor-pointer"
              >
                GOOGLE
              </button>
              <button
                type="button"
                onClick={handleFacebookLogin}
                className="text-white hover:text-gray-300 tracking-wider cursor-pointer"
              >
                FACEBOOK
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/signup"
              className="inline-block text-gray-400 hover:text-white text-sm tracking-wider border border-gray-600 px-6 py-2 rounded-md cursor-pointer"
            >
              OR SIGN UP
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
} 