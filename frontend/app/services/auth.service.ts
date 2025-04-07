import { environment } from '../config/environment';

interface LoginCredentials {
    identifier: string;
    password: string;
}

interface RegisterData extends LoginCredentials {
    username: string;
    name: string;
    surname: string;
}

interface AuthResponse {
    success: boolean;
    status: number;
    token?: string;
    message?: string;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();
            
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.message || 'Error al iniciar sesión'
                };
            }

            return {
                success: true,
                status: response.status,
                token: data.token,
                message: data.message
            };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    async register(userData: RegisterData): Promise<AuthResponse> {
        try {
            const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.message || 'Error al registrarse'
                };
            }

            return {
                success: true,
                status: response.status,
                token: data.token,
                message: data.message
            };
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    }
}; 