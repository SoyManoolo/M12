import { z } from 'zod'

const envSchema = z.object({
    // Node
    NODE_ENV: z.enum(['development', 'production', 'test']).default(`development`),
    PORT: z.string().transform(Number),

    // Database
    // Railway/producción usa una URL completa. En local se emplean DB_HOST,
    // DB_PORT, DB_NAME, DB_USER y DB_PASS.
    DATABASE_URL: z.string().url().optional(),
    DATABASE_URL_TEST: z.string().url().optional(),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASS: z.string(),
    DB_HOST: z.string(),
    DB_PORT: z.string().transform(Number),

    // Logs
    LOGS_DAYS: z.string().default('7').transform(Number),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),

    // Frontend
    FRONTEND_URL: z.string().url().optional(),
    // Orígenes extra permitidos por CORS, separados por comas.
    CORS_ORIGINS: z.string().optional(),

    // Proxy inverso
    // Número de proxies de confianza delante de la app (Railway: 1; Cloudflare Tunnel + Traefik: 2).
    TRUST_PROXY: z.string().default('1').transform(Number),
    // Redirigir a HTTPS según X-Forwarded-Proto. Desactívalo si el borde (Cloudflare) ya fuerza HTTPS.
    FORCE_HTTPS: z.string().default('true').transform(val => val === 'true'),
    // SSL en conexiones por DATABASE_URL. Desactívalo para PostgreSQL en la red interna de Coolify.
    DB_SSL: z.string().default('true').transform(val => val === 'true'),

    // Opcionales
    DB_UPDATE: z.string()
        .optional() // Permite undefined
        .default('false')
        .transform(val => val === 'true'),

    DB_NAME_TEST: z.string().optional(),
    CLEAN_USERS: z.string().transform(Number).optional(),
    CLEAN_POSTS: z.string().transform(Number).optional(),
    CLEAN_COMMENTS: z.string().transform(Number).optional(),
})

export const env = envSchema.parse(process.env);
