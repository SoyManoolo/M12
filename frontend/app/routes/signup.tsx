/**
 * @file signup.tsx
 * @description Componente de página de registro que permite a los usuarios crear una nueva cuenta.
 * Incluye registro con credenciales (nombre, apellido, usuario, email y contraseña) y opciones
 * de registro social (Google y Facebook).
 * 
 * @module SignUpPage
 * @exports SignUpPage
 * 
 * @requires react
 * @requires @remix-run/react
 * @requires @remix-run/node
 * @requires ~/services/auth.service
 */

import * as React from 'react';
import { useState } from 'react';
import { Form, useNavigate, Link } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authService } from '../services/auth.service';

/**
 * @function action
 * @description Función del servidor que maneja el envío del formulario de registro
 * @param {Object} request - Objeto de solicitud HTTP
 * @returns {Promise<Response>} Redirección a la página de inicio o de error
 * 
 * @throws {Error} Si hay problemas de conexión con el servidor
 */
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const surname = formData.get('surname') as string;
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const response = await authService.register({
      name,
      surname,
      username,
      email,
      password
    });
    
    if (response.success && response.token) {
      return redirect('/inicio', {
        headers: {
          'Set-Cookie': `token=${response.token}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
    } else {
      return redirect('/signup?error=' + encodeURIComponent(response.message || 'Error al registrarse'));
    }
  } catch (error) {
    return redirect('/signup?error=' + encodeURIComponent('Error al conectar con el servidor'));
  }
};

/**
 * @function SignUpPage
 * @description Componente principal de la página de registro
 * @returns {JSX.Element} Formulario de registro con opciones de autenticación
 * 
 * @state {string} name - Estado para el nombre del usuario
 * @state {string} surname - Estado para el apellido del usuario
 * @state {string} username - Estado para el nombre de usuario
 * @state {string} email - Estado para el correo electrónico
 * @state {string} password - Estado para la contraseña
 * @state {string} error - Estado para mensajes de error
 * 
 * @method handleSubmit - Maneja el envío del formulario de registro
 * @method handleGoogleSignUp - Maneja el registro con Google (pendiente)
 * @method handleFacebookSignUp - Maneja el registro con Facebook (pendiente)
 */
export default function SignUpPage(): React.ReactElement {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario de registro
   * @param {React.FormEvent} e - Evento del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('📤 Datos enviados al backend:', { 
      name, 
      surname, 
      username, 
      email, 
      password: '****' 
    });
    console.log('🔄 Iniciando proceso de registro...');

    try {
      const response = await authService.register({
        name,
        surname,
        username,
        email,
        password
      });
      
      console.log('📥 Respuesta del backend:', response);
      
      if (response.success && response.token) {
        console.log('✅ Registro exitoso, token recibido');
        localStorage.setItem('token', response.token);
        navigate('/inicio');
      } else {
        console.log('❌ Error en el registro:', response.message);
        setError(response.message || 'Error al registrarse');
      }
    } catch (error) {
      console.error('⚠️ Error al conectar con el servidor:', error);
      setError('Error al conectar con el servidor');
    }
  };

  /**
   * @function handleGoogleSignUp
   * @description Maneja el registro con Google (pendiente de implementación)
   */
  const handleGoogleSignUp = () => {
    console.log('🔵 Iniciando registro con Google...');
    // Implementar signup con Google
    navigate('/inicio');
  };

  /**
   * @function handleFacebookSignUp
   * @description Maneja el registro con Facebook (pendiente de implementación)
   */
  const handleFacebookSignUp = () => {
    console.log('🔵 Iniciando registro con Facebook...');
    // Implementar signup con Facebook
    navigate('/inicio');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
        <h1 className="text-4xl text-white text-center mb-8 font-bold tracking-wider">SIGN UP</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <Form method="post" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              NAME
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
              required
            />
          </div>

          <div>
            <label htmlFor="surname" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              SURNAME
            </label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              USERNAME
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              EMAIL
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
              required
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
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors tracking-wider cursor-pointer"
          >
            SIGN UP
          </button>

          <div className="mt-6">
            <p className="text-gray-400 text-center mb-4 tracking-wider">SIGN UP WITH:</p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="text-white hover:text-gray-300 tracking-wider cursor-pointer"
              >
                GOOGLE
              </button>
              <button
                type="button"
                onClick={handleFacebookSignUp}
                className="text-white hover:text-gray-300 tracking-wider cursor-pointer"
              >
                FACEBOOK
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-block text-gray-400 hover:text-white text-sm tracking-wider border border-gray-600 px-6 py-2 rounded-md cursor-pointer"
            >
              BACK TO LOGIN
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
