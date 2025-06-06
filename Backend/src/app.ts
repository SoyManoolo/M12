import './models/index'
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppErrorHandler } from './middlewares/errors/AppErrorHandler';
import userRoutes from './routes/user'
import authRoutes from './routes/auth';
import postRoutes from './routes/post';
import chatROutes from './routes/chat';
import commentRoutes from './routes/comment';
import friendshipRoutes from './routes/friendship.routes';
import { celebrateErrorHandler } from './middlewares/errors/CelebrateErrorHandler';
import path from 'path';
import helmet from 'helmet';

export const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.set('trust proxy', true);

// Configurar middleware para servir archivos estáticos desde la carpeta 'media'
app.use('/media', express.static(path.join(process.cwd(), 'media')));

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