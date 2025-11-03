import './models/index'
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Configuraciones
import { corsOptions } from './config/cors';
import { helmetOptions } from './config/helmet';
import dbLogger from './config/logger';

// Rutas
import userRoutes from './routes/user'
import authRoutes from './routes/auth';
import postRoutes from './routes/post';
import chatRoutes from './routes/chat';
import commentRoutes from './routes/comment';
import friendshipRoutes from './routes/friendship';

// Middlewares de error
import { celebrateErrorHandler } from './middlewares/errors/CelebrateErrorHandler';
import { AppErrorHandler } from './middlewares/errors/AppErrorHandler';

export const app = express();

// Logging
if (process.env.NODE_ENV === 'development') {
    // Desarrollo: colorizado, fácil de leer
    app.use(morgan('dev'));
} else {
    // Producción: completo, ignorar health checks
    app.use(morgan('combined', {
        stream: {
            write: (message: string) => {
                dbLogger.info(message.trim());
            }
        },
        skip: (req) => req.path === '/health'
    }));
}

// Seguridad
app.use(cors(corsOptions));
app.use(helmet(helmetOptions));

// Rate limiting global
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        success: false,
        status: 429,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Rate limiting ESTRICTO para autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 5,                     // Solo 5 intentos de login
    message: {
        success: false,
        status: 429,
        message: 'Too many authentication attempts, please try again in 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true  // ✅ No contar logins exitosos
});

// Parsing
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compresión
app.use(compression());

// Proxy
app.set('trust proxy', true);

// Health check endpoint - SIN autenticación, para probar conectividad
app.get('/health', (req, res) => {
    const timestamp = new Date().toISOString();
    dbLogger.debug('[HEALTH] ✅ Health check recibido en', { timestamp });
    dbLogger.debug('[HEALTH] Headers:', { headers: req.headers });
    dbLogger.debug('[HEALTH] IP:', { ip: req.ip });
    dbLogger.debug('[HEALTH] Protocol:', { protocol: req.protocol });

    const responseData = {
        status: 'OK',
        timestamp,
        environment: process.env.NODE_ENV,
        port: process.env.PORT,
        host: req.hostname,
        ip: req.ip
    };

    dbLogger.debug('[HEALTH] Enviando respuesta:', responseData);
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
app.use('/auth', authLimiter, authRoutes);
app.use('/posts', postRoutes);
app.use('/chat', chatRoutes);
app.use('/comments', commentRoutes);
app.use('/friendship', friendshipRoutes);

// Ruta no encontrada (404)
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        status: 404,
        message: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Middleware de manejo de errores
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    celebrateErrorHandler(error, req, res, next);
});

app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
    AppErrorHandler.errorHandler(error, req, res, next);
});