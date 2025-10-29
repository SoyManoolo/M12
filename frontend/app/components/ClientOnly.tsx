// app/components/ClientOnly.tsx
import { useState, useEffect, ReactNode } from 'react';

export function ClientOnly({ children }: { children: ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Durante SSR o antes de la hidratación, devuelve null, evitando la TDZ.
    if (!hasMounted) {
        return null;
    }

    return <>{children}</>;
}