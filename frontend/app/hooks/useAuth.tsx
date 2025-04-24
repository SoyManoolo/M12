import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
    isAuthenticated: boolean;
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

    useEffect(() => {
        // Sincronizar el token con localStorage
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const logout = async () => {
        try {
            await authService.logout();
            setToken(null);
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const value: AuthContextType = {
        token,
        setToken,
        isAuthenticated: !!token,
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