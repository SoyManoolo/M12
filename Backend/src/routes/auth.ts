import express from "express";
import { Request, Response, NextFunction } from 'express';
import { User } from "../models";
import { compare, hash } from "bcryptjs";
import { AuthToken } from "../middlewares/validation/authentication/jwt";

const router = express.Router();

router.get('/login', async (req: Request, res: Response, next: NextFunction) => {})

export default router

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password} = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) res.status(404).json({
            success: false,
            status: 404,
            message: 'User not found'
        });

        const correctPassword = await compare(password, user!.dataValues.password);

        if (!correctPassword) res.status(401).json({
            success: false,
            status: 401,
            message: 'Incorrect password'
        });

        const token = new AuthToken().generateToken(user!);

        res.status(200).json({
            success: true,
            status: 200,
            token
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            status: 500,
            message: error.message || 'Internal Server Error'
        });
    }
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, username, name, surname, password} = req.body;

        const user = await User.create({
            email,
            username,
            name,
            surname,
            password: await hash(password, 10)
        });

        if (!user) res.status(500).json({
            success: false,
            status: 500,
            message: 'Failed to create user'
        });

        const token = new AuthToken().generateToken(user);

        res.status(200).json({
            success: true,
            status: 200,
            token
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            status: 500,
            message: error.message || 'Internal Server Error'
        });
    }
});