import { environment } from '../config/environment';

interface LoginCredentials {
    email: string;
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
            return data;
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
            return data;
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