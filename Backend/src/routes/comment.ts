import express from "express";
import { Request, Response, NextFunction } from 'express';
import { validateComment } from '../middlewares/validation/commentValidation';
import { AuthToken } from '../middlewares/validation/authentication/jwt';

const router = express.Router();
import { CommentService } from '../services/comment';
import { CommentController } from '../controllers/comment';
const commentService = new CommentService();
const commentController = new CommentController(commentService);

// Crear un nuevo comentario
router.post('/', AuthToken.verifyToken, validateComment, async (req: Request, res: Response, next: NextFunction) => {
    await commentController.createComment(req, res, next);
});

// Obtener comentarios de un post
router.get('/:postId', async (req: Request, res: Response, next: NextFunction) => {
    await commentController.getComments(req, res, next);
});

// Eliminar un comentario
router.delete('/:commentId', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await commentController.deleteComment(req, res, next);
});

export default router