import express from "express";
import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user";
import { UserController } from "../controllers/user";
import { UpdateValidation } from "../middlewares/validation/updates/UpdateValidation";
import { UserValidator } from "../middlewares/validation/user/UserValidator";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);
const updateValidation = new UpdateValidation();
const { updateUserValidator } = updateValidation;
const userValidator = new UserValidator();
const { IdValidator, UsernameValidator } = userValidator;

// Ruta para obtener todos los usuarios
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUsers(req, res, next);
});

// Ruta para obtener un usuario por su username
router.get('/username', UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

router.patch('/username', UsernameValidator, updateUserValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

router.delete('/username', UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

router.post('/username/profile-picture', UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {

});

router.delete('/username/profile-picture', UsernameValidator, async (req: Request, res: Response, next: NextFunction) => {

});

router.get('/:id', IdValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

router.patch('/:id', IdValidator, updateUserValidator, async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

router.post('/:id/profile-picture', IdValidator, async (req: Request, res: Response, next: NextFunction) => {

});

router.delete('/:id/profile-picture', IdValidator, async (req: Request, res: Response, next: NextFunction) => {

});

export default router