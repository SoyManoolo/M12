import { Request, Response, NextFunction } from 'express';
import { friendshipService } from '../services/friendship.service';
import { AppError } from '../middlewares/errors/AppError';
import dbLogger from '../config/logger';

export class FriendshipController {
    /**
     * Envía una solicitud de amistad
     */
    public async sendFriendRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { receiver_id, created_from } = req.body;
            const sender_id = (req as any).user.user_id;

            const friendRequest = await friendshipService.sendFriendRequest(sender_id, receiver_id, created_from);
            res.status(201).json(friendRequest);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Acepta una solicitud de amistad
     */
    public async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { request_id } = req.params;
            const receiver_id = (req as any).user.user_id;

            const friendRequest = await friendshipService.acceptFriendRequest(request_id, receiver_id);
            res.json(friendRequest);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Rechaza una solicitud de amistad
     */
    public async rejectFriendRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { request_id } = req.params;
            const receiver_id = (req as any).user.user_id;

            const friendRequest = await friendshipService.rejectFriendRequest(request_id, receiver_id);
            res.json(friendRequest);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene las solicitudes de amistad pendientes
     */
    public async getPendingFriendRequests(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = (req as any).user.user_id;
            const requests = await friendshipService.getPendingFriendRequests(user_id);
            res.json(requests);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene la lista de amigos
     */
    public async getUserFriends(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = (req as any).user.user_id;
            const friends = await friendshipService.getUserFriends(user_id);
            res.json(friends);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Elimina una amistad
     */
    public async removeFriendship(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = (req as any).user.user_id;
            const { friend_id } = req.params;

            await friendshipService.removeFriendship(user_id, friend_id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export const friendshipController = new FriendshipController(); 