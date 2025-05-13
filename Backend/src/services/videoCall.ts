import { User, VideoCalls } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { Op } from "sequelize";

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

            const queueArray = Array.from(VideoCallService.waitingQueue);

            const socket_id1 = VideoCallService.waitingQueue.get(user_id);
            if (!socket_id1) throw new AppError(404, 'UserNotFoundInQueue');

            if (queueArray.length <= 1) return false;

            let randomIndex;
            let user2;

            do {
                randomIndex = Math.floor(Math.random() * queueArray.length);
                user2 = queueArray[randomIndex];
            } while (user2[0] === user_id);

            const user2_id = user2[0];
            const socket_id2 = user2[1];

            VideoCallService.waitingQueue.delete(user_id);
            VideoCallService.waitingQueue.delete(user2_id);

            const newVideoCall = await VideoCalls.create({
                user1_id: user_id,
                user2_id,

            })

            VideoCallService.activeCalls.set(newVideoCall.dataValues.call_id, JSON.stringify({
                users: [
                    { id: user_id, socketId: socket_id1 },
                    { id: user2_id, socketId: socket_id2 }
                ],
                startTime: new Date(),
                status: 'connecting'
            }));

            return {
                call_id: newVideoCall.dataValues.call_id,
                match: {
                    id: user2_id,
                    socketId: socket_id2,
                },
                self: {
                    id: user_id,
                    socketId: socket_id1,
                }
            };
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

    // Método para terminar la llamada
    public async endCall(user_id: string, call_id: string) {
        try {
            const user = await existsUser({ user_id });
            if (!user) throw new AppError(404, 'UserNotFound');

            const call = await VideoCalls.findOne({
                where: {
                    call_id,
                    [Op.or]: [
                        { user1_id: user_id },
                        { user2_id: user_id },
                    ],
                },
            });

            if (!call) throw new AppError(404, 'CallNotFound');

            await call.update({
                ended_at: new Date(),
                status: "ended",
            });

            VideoCallService.activeCalls.delete(call_id);

            return call;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para dejar la cola de espera
    public async leaveQueue(user_id: string) {
        try {
            const user = await existsUser({ user_id });
            if (!user) throw new AppError(404, 'UserNotFound');

            if (!VideoCallService.waitingQueue.has(user_id)) return false;

            VideoCallService.waitingQueue.delete(user_id);

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    }
};