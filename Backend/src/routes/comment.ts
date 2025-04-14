import express from "express";
import { Request, Response, NextFunction } from 'express';

const router = express.Router();
import { CommentService } from '../services/comment';
import { CommentController } from '../controllers/comment';
const commentService = new CommentService();
const commentController = new CommentController(commentService);

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await commentController.getComments(req, res, next);
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await commentController.deleteComment(req, res, next);
});

export default router