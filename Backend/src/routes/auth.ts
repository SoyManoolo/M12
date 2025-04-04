import express from "express";
import { Request, Response, NextFunction } from 'express';
import { AuthController } from "../controllers/auth";
import { AuthService } from "../services/auth";

const router = express.Router();

const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    await authController.login(req, res, next);
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    await authController.register(req, res, next);
});

export default router