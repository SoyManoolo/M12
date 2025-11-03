import { HelmetOptions } from 'helmet';

export const helmetOptions: HelmetOptions = {
    // ===== CONTENT SECURITY POLICY (CSP) =====
    contentSecurityPolicy: {
        directives: {
            // Scripts: Solo de del dominio + inline necesarios
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                // Si se usa Google Analytics, descomenta:
                // "https://www.google-analytics.com"
            ],

            // Estilos: Permite inline styles (Tailwind, etc.)
            styleSrc: [
                "'self'",
                "'unsafe-inline'" // Para Tailwind/CSS-in-JS
            ],

            // Imágenes: Del dominio + data URIs + cualquier HTTPS
            imgSrc: [
                "'self'",
                "data:",           // Para base64 images
                "https:"           // Para imágenes externas (avatares, etc.)
            ],

            // Videos: Del dominio
            mediaSrc: ["'self'"],

            // Fuentes: Del dominio + Google Fonts (si usas)
            fontSrc: [
                "'self'",
                "data:",
                // "https://fonts.gstatic.com" // Si usas Google Fonts
            ],

            // APIs: Tu backend + tu frontend
            connectSrc: [
                "'self'",
                process.env.FRONTEND_URL || "http://localhost:5173",
                // WebSocket también
                process.env.FRONTEND_URL?.replace('https:', 'wss:') || "ws://localhost:5173"
            ],

            // Frames: Solo tu dominio (para evitar clickjacking)
            frameSrc: ["'self'"],

            // Objetos/Embeds: Ninguno (seguridad)
            objectSrc: ["'none'"],

            // Base URI: Solo tu dominio
            baseUri: ["'self'"],

            // Form actions: Solo hacia tu dominio
            formAction: ["'self'"],

            // Upgrade insecure requests (HTTP → HTTPS)
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },

    // ===== CROSS-ORIGIN POLICIES =====
    // Permite cargar recursos desde otros orígenes (para tu frontend)
    crossOriginResourcePolicy: {
        policy: 'cross-origin' // ✅ Necesario para que frontend cargue imágenes/videos
    },

    // Aislamiento de contexto (protección contra Spectre)
    crossOriginEmbedderPolicy: false, // ⚠️ Desactivado porque puede romper imágenes externas

    // Aislamiento de ventanas (protección)
    crossOriginOpenerPolicy: {
        policy: 'same-origin-allow-popups' // ✅ Permite popups del dominio
    },

    // ===== OTRAS PROTECCIONES =====
    // HSTS: Forzar HTTPS (solo en producción)
    strictTransportSecurity: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,      // 1 año en segundos
        includeSubDomains: true,
        preload: true
    } : false,

    // X-Frame-Options: Prevenir clickjacking
    frameguard: {
        action: 'deny' // ❌ No permitir iframes
    },

    // X-Content-Type-Options: Prevenir MIME sniffing
    noSniff: true, // ✅ Activado

    // Referrer Policy: No enviar referrer a otros dominios
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },

    // X-DNS-Prefetch-Control: Desactivar prefetch
    dnsPrefetchControl: {
        allow: false
    },

    // X-Download-Options: No abrir archivos automáticamente
    ieNoOpen: true,

    // X-Permitted-Cross-Domain-Policies: No políticas de Adobe
    permittedCrossDomainPolicies: {
        permittedPolicies: 'none'
    }
};