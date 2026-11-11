import express from "express";
import { Request, Response, NextFunction } from 'express';
import { PostController } from "../controllers/post";
import { PostService } from "../services/post";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import upload from "../middlewares/multer"
import { PostValidator } from "../middlewares/validation/post/PostValidator";
import { unlink } from "fs/promises";

const router = express.Router();
const postService = new PostService();
const postController = new PostController(postService);
const postValidator = new PostValidator();
const { CreatePostValidator, UpdatePostValidator, PostIdValidator } = postValidator;

router.get('/username', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await postController.getPostsUser(req, res, next);
});

const validateCreatePost = (req: Request, res: Response, next: NextFunction) => {
    CreatePostValidator(req, res, (error?: unknown) => {
        if (!error || !req.file) {
            next(error);
        } else {
            void unlink(req.file.path).then(() => next(error)).catch(next);
        }
    });
};

router.post('/', AuthToken.verifyToken, upload.single('media'), validateCreatePost, async (req: Request, res: Response, next: NextFunction) => {
    await postController.createPost(req, res, next);
});

router.get('/', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await postController.getPosts(req, res, next);
});

router.get('/:id', PostIdValidator, async (req: Request, res: Response, next: NextFunction) => {
    await postController.getPostsUser(req, res, next);
});

router.patch('/:id', AuthToken.verifyToken, UpdatePostValidator, async (req: Request, res: Response, next: NextFunction) => {
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
