import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";

export class VideoCallService {
    private static waitingQueue: Map<string, string> = new Map();
    private static activeCalls: Map<string, string> = new Map();

    private static instance: VideoCallService;

    private constructor() {}

    public static getInstance(): VideoCallService {
        if (!VideoCallService.instance) {
            VideoCallService.instance = new VideoCallService();
        }
        return VideoCallService.instance;
    }
    // Método para manejar la cola de espera
    public async QueueVideoCall(user_id: string, socket_id: string) {
        try {
            const user = await existsUser({ user_id });
            if (!user) throw new AppError(404, 'UserNotFound');

            if (VideoCallService.waitingQueue.has(user_id)) return false;

            VideoCallService.waitingQueue.set(user_id, socket_id);

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para empearejar usuarios
    public async matchUsers(user_id: string) {
        try {
            const user = await existsUser({ user_id });
            if (!user) throw new AppError(404, 'UserNotFound');

            if (!VideoCallService.waitingQueue.has(user_id)) return false;

            // TODO

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para que usuarios se envien solicitud de amistad
    public async sendFriendRequest(user_id: string, user_id2: string) {
        try {
            const user = await existsUser({ user_id });
            const user2 = await existsUser({ user_id: user_id2 });

            if (!user) throw new AppError(404, 'UserNotFound');
            if (!user2) throw new AppError(404, 'UserNotFound');

            // TODO

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    }
};