import express from "express";
import { Request, Response, NextFunction } from 'express';
import { PostController } from "../controllers/post";
import { PostService } from "../services/post";

const router = express.Router();
const postService = new PostService();
const postController = new PostController(postService);
const { createPost, getPosts, updatePost, deletePost } = postController;

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    await createPost(req, res, next);
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await getPosts(req, res, next);
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await updatePost(req, res, next);
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await deletePost(req, res, next);
});

export default router