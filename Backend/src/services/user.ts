import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { UserFilters, UpdateUserData } from '../types/custom';

export class UserService {

    // Método para obtener todos los usuarios - LISTO
    public async getUsers() {
        try{
            const users = await User.findAll();
            if (!users || users.length === 0) throw new AppError(404, 'UserNotFound');

            return users;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }
    // Método para obtener un usuario - LISTO
    public async getUser(filters: UserFilters) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            console.log("filters", filters);

            const user = await existsUser(filters);

            if (!user) throw new AppError(404, "");

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    };

    // Método para editar un usuario
    public async updateUser(filters: UserFilters, updateData: UpdateUserData) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            console.log("filters", filters);
            console.log("updateData", updateData);

            const user = await existsUser(filters);
            if (!user) throw new AppError(404, "");

            console.log("user", user);
            const newUser = await user.update(updateData);

            if (!newUser) throw new AppError(404, "");

            await user.reload();

            return newUser;
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