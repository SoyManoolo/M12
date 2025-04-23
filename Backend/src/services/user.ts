import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { UserFilters, UpdateUserData } from '../types/custom';

export class UserService {
    // Método para obtener un usuario
    public async getUser(filters: UserFilters) {
        try {
            const query: any = {};
            if (filters.userId) query._id = filters.userId;
            if (filters.username) query.username = filters.username;

            if (Object.keys(query).length === 0) {
                throw new AppError(400, "");
            };

            const user = await User.findOne(query);
            if (!user) throw new AppError(404, "");

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');        }
    };

    // Método para editar un usuario
    public async updateUser(filters: { id?: string, username?: string }, updateData: any) {
        try {
            const query: any = {};
            if (filters.id) query._id = filters.id;
            if (filters.username) query.username = filters.username;

            if (Object.keys(query).length === 0) {
                throw new AppError(400, "");
            };

            const user = await User.findOne(query);
            if (!user) throw new AppError(404, "");

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');        };
    };

    // Método para eliminar un usuario
    public async deleteUser(filters: UserFilters) {
        try {
            const user = await existsUser(filters);

            if (!user) throw new AppError(404, "");

            await user.destroy();

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    };
};