import { environment } from '../config/environment';

/**
 * Servicio de Autenticación
 * 
 * Este servicio maneja todas las operaciones relacionadas con la autenticación:
 * - Login de usuarios
 * - Registro de nuevos usuarios
 * - Manejo de tokens JWT
 * 
 * @module auth.service
 * @requires ../config/environment
 */

/**
 * Interfaz para las credenciales de inicio de sesión
 * El campo 'id' puede ser email o nombre de usuario
 */
interface LoginCredentials {
    id: string;  // Email o nombre de usuario
    password: string;    // Contraseña del usuario
}

/**
 * Interfaz para los datos de registro de usuario
 */
interface RegisterData {
    email: string;      // Email del usuario
    username: string;   // Nombre de usuario
    name: string;       // Nombre del usuario
    surname: string;    // Apellido del usuario
    password: string;   // Contraseña
    profile_picture_url?: string; // URL de la foto de perfil (opcional)
    bio?: string;       // Biografía (opcional)
}

/**
 * Interfaz para la respuesta de autenticación
 */
interface AuthResponse {
    success: boolean;   // Indica si la operación fue exitosa
    status: number;     // Código de estado HTTP
    token?: string;     // Token JWT (opcional)
    message?: string;   // Mensaje de respuesta (opcional)
}

/**
 * Objeto que contiene los métodos de autenticación
 */
export const authService = {
    /**
     * Inicia sesión con las credenciales proporcionadas
     * 
     * @param {LoginCredentials} credentials - Credenciales de inicio de sesión
     * @returns {Promise<AuthResponse>} Respuesta del servidor
     */
async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
        // Validación básica en el frontend
        if (!credentials.id.trim()) {
            return {
                success: false,
                status: 400,
                message: 'Por favor, ingresa tu email o nombre de usuario'
            };
        }

        if (!credentials.password.trim()) {
            return {
                success: false,
                status: 400,
                message: 'Por favor, ingresa tu contraseña'
            };
        }

        const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: credentials.id,
                password: credentials.password
            }),
        });

        console.log('📊 Headers recibidos:', {
            contentType: response.headers.get('content-type'),
            statusCode: response.status,
            statusText: response.statusText
        });

        // Obtener la respuesta como texto para ver exactamente qué llega
        const rawText = await response.text();
        console.log('📥 Respuesta raw del backend:', rawText);

        // Intentar parsear como JSON
        let data: any;
        try {
            data = JSON.parse(rawText);
            console.log('✅ Respuesta parseada correctamente:', data);
        } catch (parseError) {
            console.error('❌ Error al parsear respuesta JSON:', parseError);
            console.log('❌ Primeros 500 caracteres de la respuesta:', rawText.substring(0, 500));
            return {
                success: false,
                status: response.status,
                message: 'Error al procesar la respuesta del servidor'
            };
        }

        if (!response.ok) {
            // Mensajes de error más amigables
            let errorMessage = 'No pudimos iniciar tu sesión';

            switch (data.error) {
                case 'IncorrectPassword':
                    errorMessage = 'La contraseña que ingresaste no es correcta';
                    break;
                case 'UserNotFound':
                    errorMessage = 'No encontramos una cuenta con ese email o nombre de usuario';
                    break;
                case 'DatabaseError':
                    errorMessage = 'Estamos teniendo problemas técnicos. Por favor, intenta más tarde';
                    break;
                case 'MissingIdentifier':
                    errorMessage = 'Necesitamos tu email o nombre de usuario para continuar';
                    break;
                case 'MissingPassword':
                    errorMessage = 'Por favor, ingresa tu contraseña para continuar';
                    break;
                default:
                    errorMessage = data.message || 'No pudimos iniciar tu sesión. Por favor, intenta de nuevo';
            }

            return {
                success: false,
                status: response.status,
                message: errorMessage
            };
        }

        // Si todo va bien, devuelve el objeto data (puedes ajustar según tu backend)
        return {
            success: true,
            status: response.status,
            token: data.token,
            message: data.message || 'Inicio de sesión exitoso'
        };

    } catch (error) {
        console.error("❌ Error en la petición:", error);
        return {
            success: false,
            status: 500,
            message: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
},

    /**
     * Registra un nuevo usuario
     * 
     * @param {RegisterData} userData - Datos del usuario a registrar
     * @returns {Promise<AuthResponse>} Respuesta del servidor
     */
    async register(userData: RegisterData): Promise<AuthResponse> {
        try {
            // Validaciones básicas
            if (!userData.email.trim()) {
                return {
                    success: false,
                    status: 400,
                    message: 'Por favor, ingresa tu correo electrónico'
                };
            }

            if (!userData.username.trim()) {
                return {
                    success: false,
                    status: 400,
                    message: 'Por favor, elige un nombre de usuario'
                };
            }

            if (!userData.name.trim()) {
                return {
                    success: false,
                    status: 400,
                    message: 'Por favor, ingresa tu nombre'
                };
            }

            if (!userData.surname.trim()) {
                return {
                    success: false,
                    status: 400,
                    message: 'Por favor, ingresa tus apellidos'
                };
            }

            if (!userData.password.trim()) {
                return {
                    success: false,
                    status: 400,
                    message: 'Por favor, elige una contraseña'
                };
            }

            const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Mensajes de error más amigables
                let errorMessage = 'No pudimos crear tu cuenta';

                switch (data.error) {
                    case 'EmailAlreadyExists':
                        errorMessage = 'Ya existe una cuenta con ese correo electrónico';
                        break;
                    case 'UsernameAlreadyExists':
                        errorMessage = 'Ese nombre de usuario ya está en uso';
                        break;
                    case 'InvalidEmail':
                        errorMessage = 'Por favor, ingresa un correo electrónico válido';
                        break;
                    case 'InvalidPassword':
                        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                        break;
                    default:
                        errorMessage = data.message || 'No pudimos crear tu cuenta. Por favor, intenta de nuevo';
                }

                return {
                    success: false,
                    status: response.status,
                    message: errorMessage
                };
            }

            return {
                success: true,
                status: response.status,
                message: '¡Cuenta creada con éxito! Ya puedes iniciar sesión'
            };
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                status: 500,
                message: 'No pudimos conectarnos al servidor. Por favor, verifica tu conexión a internet'
            };
        }
    },

    /**
     * Cierra la sesión del usuario actual
     * @returns {Promise<AuthResponse>} Respuesta del servidor
     */
    async logout(): Promise<AuthResponse> {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return {
                    success: false,
                    status: 401,
                    message: 'No hay sesión activa'
                };
            }

            const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.logout}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.message || 'No pudimos cerrar tu sesión'
                };
            }

            localStorage.removeItem('token');
            return {
                success: true,
                status: response.status,
                message: data.message || 'Sesión cerrada correctamente'
            };
        } catch (error) {
            console.error('Error en logout:', error);
            return {
                success: false,
                status: 500,
                message: 'No pudimos conectarnos al servidor. Por favor, verifica tu conexión a internet'
            };
        }
    }
}; 