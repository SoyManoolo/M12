import express from "express";
import { Request, Response, NextFunction } from 'express';
import { PostController } from "../controllers/post";
import { PostService } from "../services/post";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import upload from "../middlewares/multer"
import { PostValidator } from "../middlewares/validation/post/PostValidator";

const router = express.Router();
const postService = new PostService();
const postController = new PostController(postService);
const postValidator = new PostValidator();
const { CreatePostValidator, UpdatePostValidator } = postValidator;

router.get('/username', async (req: Request, res: Response, next: NextFunction) => {
    await postController.getPostsUser(req, res, next);
});

router.post('/', AuthToken.verifyToken, CreatePostValidator, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    await postController.createPost(req, res, next);
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await postController.getPosts(req, res, next);
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await postController.getPostsUser(req, res, next);
});

router.patch('/:id', AuthToken.verifyToken, UpdatePostValidator,async (req: Request, res: Response, next: NextFunction) => {
    await postController.updatePost(req, res, next);
});

router.delete('/:id', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await postController.deletePost(req, res, next);
});

// Rutas para likes
router.post('/:id/like', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await postController.likePost(req, res, next);
});

router.delete('/:id/like', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await postController.unlikePost(req, res, next);
});

router.get('/:id/like', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await postController.checkUserLike(req, res, next);
});

export default router