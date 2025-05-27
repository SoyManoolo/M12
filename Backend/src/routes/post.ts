import express from "express";
import { Request, Response, NextFunction } from 'express';
import { PostController } from "../controllers/post";
import { PostService } from "../services/post";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import upload from "../middlewares/multer"
import { PostValidator } from "../middlewares/validation/post/PostValidator";
import dbLogger from "../config/logger";

const router = express.Router();
const postService = new PostService();
const postController = new PostController(postService);
const postValidator = new PostValidator();
const { CreatePostValidator, UpdatePostValidator } = postValidator;

router.get('/username', async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Get posts by username');
    await postController.getPostsUser(req, res, next);
});

router.post('/', AuthToken.verifyToken, CreatePostValidator, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Create post');
    await postController.createPost(req, res, next);
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Get all posts');
    await postController.getPosts(req, res, next);
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Get post by id');
    await postController.getPostsUser(req, res, next);
});

router.patch('/:id', AuthToken.verifyToken, UpdatePostValidator,async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Update post');
    await postController.updatePost(req, res, next);
});

router.delete('/:id', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Delete post');
    await postController.deletePost(req, res, next);
});

// Rutas para likes
router.post('/:id/like', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Like post');
    await postController.likePost(req, res, next);
});

router.delete('/:id/like', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Unlike post');
    await postController.unlikePost(req, res, next);
});

router.get('/:id/like', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[PostRoute] Check user like on post');
    await postController.checkUserLike(req, res, next);
});

export default router