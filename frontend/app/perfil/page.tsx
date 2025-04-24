'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './hooks/useAuth';
import { authService } from './services/auth.service';

export default function Perfil() {
    const { token, isAuthenticated } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await authService.getProfile(token!);
                setUserData(response);
            } catch (error) {
                console.error('Error al cargar el perfil:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isAuthenticated, token, router]);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!userData) {
        return null;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Perfil de Usuario</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p><strong>Nombre:</strong> {userData.nombre}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                {/* Agrega más campos según sea necesario */}
            </div>
        </div>
    );
} 