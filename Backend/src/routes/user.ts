import express from "express";
import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user";
import { UserController } from "../controllers/user";

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);

router.get('/:id?', async (req: Request, res: Response, next: NextFunction) => {
    await userController.getUser(req, res, next);
});

router.patch('/:id?', async (req: Request, res: Response, next: NextFunction) => {
    await userController.updateUser(req, res, next);
});

router.delete('/:id?', async (req: Request, res: Response, next: NextFunction) => {
    await userController.deleteUser(req, res, next);
});

export default router