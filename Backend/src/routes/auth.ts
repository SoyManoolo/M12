import express from "express";
import { Request, Response, NextFunction } from 'express';
import { AuthController } from "../controllers/auth";
import { AuthService } from "../services/auth";
import { AuthValidation } from "../middlewares/validation/authentication/AuthValidation";
import dbLogger from "../config/logger";

const router = express.Router();

const authService = new AuthService();
const authController = new AuthController(authService);
const authValidation = new AuthValidation();
const { loginValidation, registerValidation } = authValidation;

router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[AuthRouter] Login request received');
    await authController.login(req, res, next);
});

router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[AuthRouter] Register request received');
    await authController.register(req, res, next);
});

router.delete('/logout/', async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info('[AuthRouter] Logout request received');
    await authController.logout(req, res, next);
});

export default router