import './models/index'
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { errors } from "celebrate";
import { AppErrorHandler } from './middlewares/errors/AppErrorHandler';
import userRoutes from './routes/user'
import authRoutes from './routes/auth';

export const app = express();
app.use(express.json());
app.use(cors());

app.set('trust proxy', true);

// Rutas
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

app.use(errors());
app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
    AppErrorHandler.errorHandler(error, req, res, next);
});