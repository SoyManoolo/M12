import express from "express";
import { Request, Response, NextFunction } from 'express';
import { PostController } from "../controllers/post";
import { PostService } from "../services/post";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import upload from "../middlewares/multer"

const router = express.Router();
const postService = new PostService();
const postController = new PostController(postService);

router.post('/', AuthToken.verifyToken, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    await postController.createPost(req, res, next);
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await postController.getPosts(req, res, next);
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await postController.updatePost(req, res, next);
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await postController.deletePost(req, res, next);
});

export default router