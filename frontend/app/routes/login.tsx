import { COOKIE_SESSION } from '~/services/session';
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
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth.tsx';
import Notification from '../components/Shared/Notification';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { environment } from '~/config/environment';
import { pageMeta } from '~/utils/seo';

export const meta = () => pageMeta('Iniciar sesión', 'Accede a tu cuenta de FriendsGo para conectar con tus amigos.', { path: '/login' });

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

            if (response.success) {
                setToken(COOKIE_SESSION);

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
        <div className="min-h-screen bg-page flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 shadow-xl shadow-purple-950/5 sm:p-8">
                <h1 className="text-3xl text-ink text-center mb-3 font-bold tracking-tight">Qué bueno verte de nuevo</h1>
                <p className="mb-8 text-center text-sm text-muted">Tu gente y tus historias te esperan.</p>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <Form method="post" onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="id" className="block text-copy text-sm font-medium mb-2 tracking-normal">
                            Email o usuario
                        </label>
                        <input
                            type="text"
                            id="id"
                            name="id"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full px-3 py-2 bg-transparent border border-line-strong rounded-md text-ink focus:outline-none focus:border-ink cursor-text"
                            required
                            placeholder="Ingresa tu email o nombre de usuario"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-copy text-sm font-medium mb-2 tracking-normal">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-transparent border border-line-strong rounded-md text-ink focus:outline-none focus:border-ink cursor-text pr-10"
                                required
                                placeholder="Ingresa tu contraseña"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="text-right">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-muted hover:text-ink tracking-normal cursor-pointer"
                        >
                            ¿Has olvidado tu contraseña?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="friendly-button w-full bg-primary text-white py-3 px-4 hover:bg-primary-hover transition-colors tracking-normal cursor-pointer"
                    >
                        Entrar
                    </button>

                    <a
                        href={`${environment.apiUrl}/auth/google`}
                        aria-label="Continuar con Google"
                        className="flex w-full items-center justify-center gap-3 rounded-md border border-line-strong px-4 py-2 text-ink transition-colors hover:bg-surface"
                    >
                        <span aria-hidden="true" className="rounded bg-white px-2 py-0.5 font-bold text-blue-600">G</span>
                        Continuar con Google
                    </a>

                    <div className="text-center mt-6">
                        <Link
                            to="/signup"
                            className="inline-block text-muted hover:text-ink text-sm tracking-normal border border-line-strong px-6 py-2 rounded-md cursor-pointer"
                        >
                            Crear mi cuenta
                        </Link>
                    </div>
                </Form>
            </div>
        </div>
    );
}
