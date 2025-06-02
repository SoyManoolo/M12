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

import React, { useState, useEffect } from 'react';
import { Form, useNavigate, Link } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authService } from '../services/auth.service';
import Notification from '../components/Shared/Notification';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
    
    if (response.success) {
      return redirect('/login');
    } else {
      return redirect('/signup');
    }
  } catch (error) {
    return redirect('/signup');
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
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>;
  }

  // Regex para validar contraseñas (al menos 8 caracteres, mayúscula, minúscula, número, caracter especial)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario de registro
   * @param {React.FormEvent} e - Evento del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 Datos enviados al backend:', { 
      name, 
      surname, 
      username, 
      email, 
      password: '****' 
    });
    console.log('🔄 Iniciando proceso de registro...');

    // Validar contraseña con el regex
    if (!passwordRegex.test(password)) {
      setNotification({
        message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&.#)',
        type: 'error'
      });
      return;
    }

    try {
      const response = await authService.register({
        name,
        surname,
        username,
        email,
        password
      });
      
      console.log('📥 Respuesta del backend:', response);
      
      if (response.success) {
        console.log('✅ Registro exitoso');
        setNotification({
          message: response.message || '¡Cuenta creada con éxito! Ya puedes iniciar sesión',
          type: 'success'
        });
        // Guardamos el mensaje en localStorage antes de navegar
        localStorage.setItem('signupSuccess', response.message || '¡Cuenta creada con éxito! Ya puedes iniciar sesión');
        navigate('/login');
      } else {
        console.log('❌ Error en el registro:', response.message);
        setNotification({
          message: response.message || 'No pudimos crear tu cuenta',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('⚠️ Error al conectar con el servidor:', error);
      setNotification({
        message: 'No pudimos conectarnos al servidor. Por favor, verifica tu conexión a internet',
        type: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
        <h1 className="text-4xl text-white text-center mb-8 font-bold tracking-wider">REGISTRARSE</h1>
        
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        
        <Form method="post" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              NOMBRE
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
              APELLIDOS
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
              NOMBRE DE USUARIO
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
              CORREO ELECTRÓNICO
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
              CONTRASEÑA
            </label>
            <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text pr-10"
              required
            />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors tracking-wider cursor-pointer"
          >
            REGISTRARSE
          </button>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-block text-gray-400 hover:text-white text-sm tracking-wider border border-gray-600 px-6 py-2 rounded-md cursor-pointer"
            >
              VOLVER A INICIAR SESIÓN
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
