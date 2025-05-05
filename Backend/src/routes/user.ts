import express from "express";
import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user";
import { UserController } from "../controllers/user";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);

// Ruta para obtener todos los usuarios
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUsers(req, res, next);
});

// Ruta para obtener un usuario por su username
router.get('/username', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    console.log("He entrado en la ruta")
    await userController.getUser(req, res, next);
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

router.patch('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

export default router