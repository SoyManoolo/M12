import express from "express";
import { Request, Response, NextFunction } from 'express';
import { sequelize } from "../config/database";

const router = express.Router();

router.get('/login', async (req: Request, res: Response, next: NextFunction) => {})

export default router
