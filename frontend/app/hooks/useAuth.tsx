import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { decodeToken, getUserInfo } from '../utils/token';

interface User {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  active_video_call: boolean;
}

interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
    isAuthenticated: boolean;
    user: User | null;
    logout: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(() => {
        // Inicializar el token desde localStorage solo en el cliente
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                // Verificar que el token sea válido
                const decodedToken = decodeToken(storedToken);
                if (!decodedToken) {
                    localStorage.removeItem('token');
                    return null;
                }
                return storedToken;
            }
        }
        return null;
    });

    const [user, setUser] = useState<User | null>(null);

    // Efecto para sincronizar el token con localStorage
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    const decodedToken = decodeToken(token);
                    if (decodedToken) {
                        // Obtener la información completa del usuario
                        const userInfo = await getUserInfo(decodedToken.user_id);
                        if (userInfo?.success) {
                            setUser(userInfo.data);
                        } else {
                            // Si no podemos obtener la información del usuario, el token podría ser inválido
                            setToken(null);
                            localStorage.removeItem('token');
                            setUser(null);
                        }
                    } else {
                        // Token inválido
                        setToken(null);
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error al inicializar la autenticación:', error);
                    setToken(null);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        initializeAuth();
    }, [token]);

    const logout = async () => {
        try {
            await authService.logout();
            setToken(null);
            localStorage.removeItem('token');
            setUser(null);
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const value: AuthContextType = {
        token,
        setToken,
        isAuthenticated: !!token,
        user,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
}