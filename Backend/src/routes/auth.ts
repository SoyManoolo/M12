import express from "express";
import { Request, Response, NextFunction } from 'express';
import { AuthController } from "../controllers/auth";
import { AuthService } from "../services/auth";
import { AuthValidation } from "../middlewares/validation/authentication/AuthValidation";
import { AuthToken } from "../middlewares/validation/authentication/jwt";

const router = express.Router();

const authService = new AuthService();
const authController = new AuthController(authService);
const authValidation = new AuthValidation();
const { loginValidation, registerValidation } = authValidation;

router.get('/google', (req: Request, res: Response) => authController.startGoogleAuth(req, res));
router.get('/google/callback', async (req: Request, res: Response) => authController.completeGoogleAuth(req, res));

router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
    await authController.login(req, res, next);
});

router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
    await authController.register(req, res, next);
});

router.post('/forgot-password', authValidation.forgotPasswordValidation.bind(authValidation), async (req: Request, res: Response, next: NextFunction) => {
    await authController.forgotPassword(req, res, next);
});

router.post('/reset-password', authValidation.resetPasswordValidation.bind(authValidation), async (req: Request, res: Response, next: NextFunction) => {
    await authController.resetPassword(req, res, next);
});

router.delete('/logout', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await authController.logout(req, res, next);
});

export default router
