import express from "express";
import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user";
import { UserController } from "../controllers/user";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);

// Ruta para obtener todos los usuarios o filtrar por username
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

// Ruta para obtener un usuario por UUID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

// Ruta para actualizar usuarios por filtros
router.patch('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

// Ruta para actualizar un usuario por UUID
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

// Ruta para eliminar usuarios por filtros
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

// Ruta para eliminar un usuario por UUID
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

export default router