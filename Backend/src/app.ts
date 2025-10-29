import './models/index'
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
        "http://localhost:5173", // Para desarrollo local
        "http://localhost:3000"  // Para desarrollo local alternativo
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
    // Asegurar que CORS se aplique incluso en errores
    const origin = req.headers.origin;
    const allowedOrigins = [
        "https://friendsgofrontend.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Ngrok-Skip-Browser-Warning');
    
    celebrateErrorHandler(error, req, res, next);
});

app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
    // Asegurar que CORS se aplique incluso en errores
    const origin = req.headers.origin;
    const allowedOrigins = [
        "https://friendsgofrontend.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Ngrok-Skip-Browser-Warning');
    
    AppErrorHandler.errorHandler(error, req, res, next);
});