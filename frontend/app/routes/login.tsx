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
 * @requires react-router
 * @requires react-router
 * @requires ~/services/auth.service
 * @requires ~/hooks/useAuth.tsx
 * @requires ~/hooks/useMessage
 * @requires ~/components/Shared/Message
 */

import { useState, useEffect } from 'react';
import { Form, Link, useNavigate } from "react-router";
import type { ActionFunction } from "react-router";
import { redirect } from "react-router";
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth.tsx';
import Notification from '../components/Shared/Notification';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * @function action
 * @description Función del servidor que maneja el envío del formulario de inicio de sesión
 * @param {Object} request - Objeto de solicitud HTTP
 * @returns {Promise<Response>} Redirección a la página de inicio o de error
 */
export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const password = formData.get('password') as string;

    try {
        const response = await authService.login({ id, password });

        if (response.success && response.token) {
            return redirect('/inicio', {
                headers: {
                    'Set-Cookie': `token=${response.token}; Path=/; HttpOnly; SameSite=Lax`
                }
            });
        } else {
            return redirect('/login');
        }
    } catch (error) {
        return redirect('/login');
    }
};

/**
 * @function LoginPage
 * @description Componente principal de la página de inicio de sesión
 * @returns {JSX.Element} Formulario de inicio de sesión con opciones de autenticación
 * 
 * @state {string} id - Estado para el email o nombre de usuario
 * @state {string} password - Estado para la contraseña
 * @state {string} error - Estado para mensajes de error
 * @state {string} message - Estado para mensajes de éxito
 * @state {boolean} showPassword - Estado para mostrar/ocultar la contraseña
 * 
 * @method handleSubmit - Maneja el envío del formulario de inicio de sesión
 */
export default function LoginPage() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { setToken } = useAuth();
    const navigate = useNavigate();
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    useEffect(() => {
        // Verificar si hay un mensaje de éxito del registro
        const signupSuccess = localStorage.getItem('signupSuccess');
        if (signupSuccess) {
            setNotification({
                message: signupSuccess,
                type: 'success'
            });
            localStorage.removeItem('signupSuccess');
        }
    }, []);

    /**
     * @function handleSubmit
     * @description Maneja el envío del formulario de inicio de sesión
     * @param {React.FormEvent} e - Evento del formulario
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await authService.login({ id, password });

            if (response.success && response.token) {
                setToken(response.token);
                
                setNotification({
                    message: response.message || '¡Bienvenido de nuevo!',
                    type: 'success'
                });
                
                // Pequeño delay para asegurar que el estado se actualice
                await new Promise(resolve => setTimeout(resolve, 100));
                // Navegar directamente a inicio
                navigate('/inicio', { replace: true });
            } else {
                setNotification({
                    message: response.message || 'No pudimos iniciar tu sesión',
                    type: 'error'
                });
            }
        } catch {
            setNotification({
                message: 'No pudimos conectarnos al servidor. Por favor, verifica tu conexión a internet',
                type: 'error'
            });
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
                <h1 className="text-4xl text-white text-center mb-8 font-bold tracking-wider">INICIA SESIÓN</h1>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <Form method="post" onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="id" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
                            EMAIL O USUARIO
                        </label>
                        <input
                            type="text"
                            id="id"
                            name="id"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
                            required
                            placeholder="Ingresa tu email o nombre de usuario"
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
                                placeholder="Ingresa tu contraseña"
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

                    <div className="text-right">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-gray-400 hover:text-white tracking-wider cursor-pointer"
                        >
                            HAS OLVIDADO TU CONTRASEÑA?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors tracking-wider cursor-pointer"
                    >
                        INICIA SESIÓN
                    </button>

                    <div className="text-center mt-6">
                        <Link
                            to="/signup"
                            className="inline-block text-gray-400 hover:text-white text-sm tracking-wider border border-gray-600 px-6 py-2 rounded-md cursor-pointer"
                        >
                            O REGISTRATE
                        </Link>
                    </div>
                </Form>
            </div>
        </div>
    );
} 
