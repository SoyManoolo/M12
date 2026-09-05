import express from "express";
import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user";
import { UserController } from "../controllers/user";
import { UserValidator } from "../middlewares/validation/user/UserValidator";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import upload from "../middlewares/multer";
import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);
const userValidator = new UserValidator();
const { IdValidator, UsernameValidator, updateUserValidator } = userValidator;

const authorizeUserMutation = async (req: Request<{ id?: string }>, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.user_id) throw new AppError(401, 'Unauthorized');

        const target = req.params.id
            ? await User.findByPk(req.params.id)
            : await User.findOne({ where: { username: req.query.username as string } });
        if (!target) throw new AppError(404, 'UserNotFound');

        if (target.user_id !== req.user.user_id) {
            const requester = await User.findByPk(req.user.user_id);
            if (!requester || !requester.is_moderator) throw new AppError(403, 'Forbidden');
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Ruta para obtener todos los usuarios
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUsers(req, res, next);
});

router.get('/me', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await userController.getCurrentUser(req, res, next);
});

router.get('/admin', AuthToken.verifyToken, AuthToken.isModerator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.getAdminUsers(req, res, next);
});

// Ruta para obtener un usuario por su username (búsqueda exacta)
router.get('/username', UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

// Nueva ruta para buscar usuarios de forma flexible
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    await userController.searchUsers(req, res, next);
});

router.patch('/username', AuthToken.verifyToken, UsernameValidator, authorizeUserMutation, updateUserValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

router.delete('/username', AuthToken.verifyToken, UsernameValidator, authorizeUserMutation, async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

router.post('/username/profile-picture', AuthToken.verifyToken, UsernameValidator, authorizeUserMutation, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    await userController.uploadProfilePicture(req, res, next);
});

router.delete('/username/profile-picture', AuthToken.verifyToken, UsernameValidator, authorizeUserMutation, async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteProfilePicture(req, res, next);
});

router.get('/:id', IdValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

router.patch('/:id', AuthToken.verifyToken, IdValidator, authorizeUserMutation, updateUserValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

router.delete('/:id', AuthToken.verifyToken, IdValidator, authorizeUserMutation, async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

router.post('/:id/profile-picture', AuthToken.verifyToken, IdValidator, authorizeUserMutation, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    await userController.uploadProfilePicture(req, res, next);
});

router.delete('/:id/profile-picture', AuthToken.verifyToken, IdValidator, authorizeUserMutation, async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteProfilePicture(req, res, next);
});

export default router
