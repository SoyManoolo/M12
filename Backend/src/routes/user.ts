import express from "express";
import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user";
import { UserController } from "../controllers/user";
import { UserValidator } from "../middlewares/validation/user/UserValidator";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import upload from "../middlewares/multer";
import dbLogger from "../config/logger";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);
const userValidator = new UserValidator();
const { IdValidator, UsernameValidator, updateUserValidator } = userValidator;

// Ruta para obtener todos los usuarios
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUsers(req, res, next);
});

// Ruta para obtener un usuario por su username (búsqueda exacta)
router.get('/username', UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Get user by username');
    await userController.getUser(req, res, next);
});

// Nueva ruta para buscar usuarios de forma flexible
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Search users route');
    await userController.searchUsers(req, res, next);
});

router.patch('/username', UsernameValidator, updateUserValidator, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Update user by username');
    await userController.updateUser(req, res, next);
});

router.delete('/username', UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Delete user by username');
    await userController.deleteUser(req, res, next);
});

router.post('/username/profile-picture', AuthToken.verifyToken, UsernameValidator, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Upload profile picture by username');
    await userController.uploadProfilePicture(req, res, next);
});

router.delete('/username/profile-picture', AuthToken.verifyToken, UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Delete profile picture by username');
    await userController.deleteProfilePicture(req, res, next);
});

router.get('/:id', IdValidator, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Get user by ID');
    await userController.getUser(req, res, next);
});

router.patch('/:id', AuthToken.verifyToken, IdValidator, updateUserValidator, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Update user by ID');
    await userController.updateUser(req, res, next);
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Delete user by ID');
    await userController.deleteUser(req, res, next);
});

router.post('/:id/profile-picture', AuthToken.verifyToken, IdValidator, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Upload profile picture by ID');
    await userController.uploadProfilePicture(req, res, next);
});

router.delete('/:id/profile-picture', AuthToken.verifyToken, IdValidator, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[UserRouter] Delete profile picture by ID');
    await userController.deleteProfilePicture(req, res, next);
});

export default router