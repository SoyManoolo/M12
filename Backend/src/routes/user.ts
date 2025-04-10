import express from "express";
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

router.get('/:', async (req: Request, res: Response, next: NextFunction) => {

});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {

});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {

});

export default router