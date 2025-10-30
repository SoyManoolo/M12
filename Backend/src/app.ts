console.log('[DEBUG-APP] 1. app.ts cargando...');
import './models/index'
console.log('[DEBUG-APP] 2. Models importados');
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppErrorHandler } from './middlewares/errors/AppErrorHandler';
import userRoutes from './routes/user'
import authRoutes from './routes/auth';
import postRoutes from './routes/post';
import chatROutes from './routes/chat';
import commentRoutes from './routes/comment';
import friendshipRoutes from './routes/friendship';
import { celebrateErrorHandler } from './middlewares/errors/CelebrateErrorHandler';
import path from 'path';
import helmet from 'helmet';

const corsOptions = {
    origin: [
        "https://friendsgofrontend.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
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

export const app = express();

// Logging de TODAS las peticiones
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

// Aplicar CORS antes de cualquier otra cosa
app.use(cors(corsOptions));

app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.set('trust proxy', true);

// Health check endpoint - SIN autenticación, para probar conectividad
app.get('/health', (req, res) => {
    const timestamp = new Date().toISOString();
    console.log('[HEALTH] ✅ Health check recibido en', timestamp);
    console.log('[HEALTH] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[HEALTH] IP:', req.ip);
    console.log('[HEALTH] Protocol:', req.protocol);

    const responseData = {
        status: 'OK',
        timestamp,
        environment: process.env.NODE_ENV,
        port: process.env.PORT,
        host: req.hostname,
        ip: req.ip
    };

    console.log('[HEALTH] Enviando respuesta:', JSON.stringify(responseData));
    res.status(200).json(responseData);
});

// Configurar middleware para servir archivos estáticos desde la carpeta 'media'
app.use('/media', express.static(path.join(process.cwd(), 'media')));

// Configurar middleware para servir archivos estáticos desde la carpeta 'assets'
app.use('/assets', express.static(path.join(process.cwd(), 'src/assets')));

// Configurar middleware para servir archivos estáticos desde la carpeta 'public'
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Rutas
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/chat', chatROutes);
app.use('/comments', commentRoutes);
app.use('/friendship', friendshipRoutes);

// Middleware de manejo de errores
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    celebrateErrorHandler(error, req, res, next);
});

app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
    AppErrorHandler.errorHandler(error, req, res, next);
});