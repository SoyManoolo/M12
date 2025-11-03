// config/cors.ts
import { CorsOptions } from 'cors';

// Orígenes permitidos (compartido entre Express y Socket.io)
export const ALLOWED_ORIGINS = [
    "https://friendsgofrontend.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000"
];

export const corsOptions: CorsOptions = {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Ngrok-Skip-Browser-Warning'
    ],
    exposedHeaders: ['Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};