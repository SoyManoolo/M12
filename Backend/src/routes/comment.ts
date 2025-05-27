import express from "express";
import { Request, Response, NextFunction } from 'express';
import { AuthToken } from '../middlewares/validation/authentication/jwt';
import { CommentValidation } from '../middlewares/validation/commentValidation';
const { validateComment } = new CommentValidation();

const router = express.Router();
import { CommentService } from '../services/comment';
import { CommentController } from '../controllers/comment';
import dbLogger from "../config/logger";
const commentService = new CommentService();
const commentController = new CommentController(commentService);

// Crear un nuevo comentario
router.post('/', AuthToken.verifyToken, validateComment, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[CommentRouter] Creando un nuevo comentario');
    await commentController.createComment(req, res, next);
});

// Obtener comentarios de un post
router.get('/:postId', async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[CommentRouter] Obteniendo comentarios del post');
    await commentController.getComments(req, res, next);
});

// Eliminar un comentario
router.delete('/:commentId', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[CommentRouter] Eliminando un comentario');
    await commentController.deleteComment(req, res, next);
});

export default router