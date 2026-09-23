import { NextFunction, Request, Response } from 'express';
import { adminService } from '../services/admin';

export class AdminController {
    public async getStats(_req: Request, res: Response, next: NextFunction) {
        try {
            res.json({ success: true, data: await adminService.getStats() });
        } catch (error) {
            next(error);
        }
    }
}

export const adminController = new AdminController();
