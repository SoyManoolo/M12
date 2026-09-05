import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { decodeToken, getUserInfo } from '../utils/token';
import { developmentLogger } from '../utils/logger';
import { clearSessionToken, getSessionToken, setSessionToken } from '../utils/session';

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

function syncAuthenticationCookie(token: string | null) {
    if (typeof document === 'undefined') return;

    if (token) {
        document.cookie = `token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=3600`;
    } else {
        document.cookie = 'token=; Path=/; SameSite=Lax; Max-Age=0';
    }
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setTokenState] = useState<string | null>(() => {
        // Inicializar el token desde el almacenamiento disponible en el cliente.
        if (typeof window !== 'undefined') {
            try {
                const storedToken = getSessionToken();
                if (storedToken) {
                    // Verificar que el token sea válido (usa el decodeToken ya seguro para SSR)
                    const decodedToken = decodeToken(storedToken);
                    if (!decodedToken) {
                        clearSessionToken();
                        return null;
                    }
                    return storedToken;
                }
            } catch (error) {
                developmentLogger.warn('No se pudo acceder al almacenamiento de sesión.', error);
                return null;
            }
        }
        return null;
    });

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Wrapper para setToken que usa el mismo mecanismo en toda la sesión.
    const setToken = (newToken: string | null) => {
        setTokenState(newToken);
        syncAuthenticationCookie(newToken);
        if (typeof window !== 'undefined') {
            if (newToken) setSessionToken(newToken);
            else clearSessionToken();
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            if (token) {
                try {
                    const decodedToken = decodeToken(token);
                    if (decodedToken) {
                        // OJO: MODIFICACIÓN AQUÍ. Pasar el token como segundo argumento.
                        const userInfo = await getUserInfo(decodedToken.user_id, token);
                        if (userInfo?.success) {
                            setUser(userInfo.data);
                        } else if (userInfo?.status === 401 || userInfo?.status === 403) {
                            // Solo una respuesta explícita de autorización invalida la sesión.
                            setToken(null);
                            setUser(null);
                        } else {
                            // Ante un fallo transitorio se conserva el token para que la siguiente
                            // navegación o recarga pueda reintentar la consulta.
                            setUser(null);
                        }
                    } else {
                        // Token inválido
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    developmentLogger.error('Error al inicializar la autenticación.', error);
                    setToken(null);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, [token]);

    useEffect(() => {
        syncAuthenticationCookie(token);
    }, [token]);

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
        token,
        setToken,
        // CRÍTICO: isAuthenticated ahora verifica que tengamos token Y que no estemos cargando
        // Esto evita que se redirija a login mientras se está cargando el usuario
        isAuthenticated: !!token && !isLoading,
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
