import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { developmentLogger } from '../utils/logger';

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
    /** Marcador de compatibilidad para servicios heredados; nunca contiene un JWT. */
    token: string | null;
    setToken: (token: string | null) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    logout: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [sessionVersion, setSessionVersion] = useState(0);

    // Se conserva la firma para los consumidores existentes. El valor recibido
    // no se guarda: la cookie HttpOnly es la única fuente de sesión.
    const setToken = useCallback((newToken: string | null) => {
        if (!newToken) {
            setIsAuthenticated(false);
            setUser(null);
            return;
        }
        setIsAuthenticated(true);
        setSessionVersion(version => version + 1);
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            try {
                const userInfo = await authService.getCurrentUser();
                if (userInfo.success && userInfo.data) {
                    setUser(userInfo.data as User);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                developmentLogger.error('Error al inicializar la autenticación.', error);
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, [sessionVersion]);

    const logout = async () => {
        try {
            await authService.logout();
            setToken(null);
            setUser(null);
        } catch (error) {
            developmentLogger.error('Error al cerrar sesión.', error);
            // Limpiar localmente aunque falle la petición
            setToken(null);
            setUser(null);
        }
    };

    const value: AuthContextType = {
        token: isAuthenticated ? 'cookie-session' : null,
        setToken,
        // CRÍTICO: isAuthenticated ahora verifica que tengamos token Y que no estemos cargando
        // Esto evita que se redirija a login mientras se está cargando el usuario
        isAuthenticated: isAuthenticated && !isLoading,
        isLoading,
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
