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
        'http://localhost:5173',
        'http://192.168.1.133:5173',
        'https://a73a-79-117-245-149.ngrok-free.app',
        /\.ngrok-free\.app$/
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
};

export const app = express();

app.use(express.json());
app.use(cors(corsOptions));
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
    celebrateErrorHandler(error, req, res, next);
});

app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
    AppErrorHandler.errorHandler(error, req, res, next);
});