import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { UserFilters, UpdateUserData } from '../types/custom';

// Función para validar UUID
function isValidUUID(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export class UserService {
    // Método para obtener un usuario
    public async getUser(filters: UserFilters) {
        try {
            // Caso 1: Buscar por UUID
            if (filters.user_id) {
                if (!isValidUUID(filters.user_id)) {
                    throw new AppError(404, "UUID no válido");
                }
                const user = await User.findByPk(filters.user_id);
                if (!user) throw new AppError(404, "Usuario no encontrado");
                return [user];
            }

            // Caso 2: Buscar por username
            if (filters.username) {
                const user = await User.findOne({
                    where: {
                        username: filters.username
                    }
                });
                if (!user) throw new AppError(404, "Usuario no encontrado");
                return [user];
            }

            // Caso 3: Sin filtros, devolver todos los usuarios
            return await User.findAll();

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    };

    // Método para editar un usuario
    public async updateUser(filters: { id?: string, username?: string }, updateData: any) {
        try {
            const query: any = {};
            if (filters.id) query.user_id = filters.id;
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