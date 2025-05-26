import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { decodeToken } from '../utils/token';

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
            return localStorage.getItem('token');
        }
        return null;
    });

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Sincronizar el token con localStorage
        if (token) {
            localStorage.setItem('token', token);
            // Decodificar el token para obtener la información del usuario
            const decodedUser = decodeToken(token);
            if (decodedUser) {
                setUser(decodedUser);
            }
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
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