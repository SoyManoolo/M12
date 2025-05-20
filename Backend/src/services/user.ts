import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { UserFilters, UpdateUserData } from '../types/custom';
import { Op } from "sequelize";
import path from "path";
import fs from "fs";
import dbLogger from "../config/logger";

export class UserService {
    private readonly imageBasePath: string = '/media/images';

    // Método para obtener todos los usuarios - LISTO
    public async getUsers(limit: number = 10, cursor?: string) {
        try {
            const queryOptions: any = {
                limit: limit + 1, // +1 para verificar si hay más páginas
                order: [['created_at', 'DESC']], // Ordenamiento explícito
                attributes: [
                    'user_id',
                    'username',
                    'name',
                    'surname',
                    'profile_picture',
                    'bio',
                    'is_moderator',
                    'created_at'
                ],
            };

            if (cursor) {
                const lastUser = await User.findByPk(cursor);
                if (lastUser) {
                    queryOptions.where = {
                        created_at: {
                            [Op.lt]: lastUser.dataValues.created_at
                        }
                    };
                }
            }

            const users = await User.findAll(queryOptions);

            // Verificar si no hay usuarios
            if (!users || users.length === 0) {
                throw new AppError(404, 'No se encontraron usuarios');
            }

            // Determinar si hay más páginas
            const hasNextPage = users.length > limit;

            // Recortar el array si obtenemos uno extra para determinar hasNextPage
            const resultUsers = hasNextPage ? users.slice(0, limit) : users;

            // Determinar el próximo cursor
            const nextCursor = hasNextPage ? resultUsers[resultUsers.length - 1].dataValues.user_id : null;

            return {
                users: resultUsers,
                hasNextPage,
                nextCursor
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Error interno del servidor');
        }
    }

    // Método para obtener un usuario - LISTO
    public async getUser(filters: UserFilters) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

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

            const user = await existsUser(filters);
            if (!user) throw new AppError(404, "");

            const newUser = await user.update(updateData);

            if (!newUser) throw new AppError(404, "");

            await user.reload();

            return newUser;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
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

    // Método para actualizar la foto de perfil de un usuario
    public async updateProfilePicture(filters: UserFilters, profilePicture: Express.Multer.File) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            const user = await existsUser(filters);

            if (!user) throw new AppError(404, "");

            const actualImage = user.dataValues.profile_picture;

            // Si el usuario ya tiene una imagen de perfil, la eliminamos
            if (actualImage) {
                try {
                    // Obtener la ruta completa del archivo
                    const filePath = path.join(process.cwd(), actualImage);

                    // Comprobar si el archivo existe antes de intentar eliminarlo
                    if (fs.existsSync(filePath)) {
                        // Eliminar el archivo
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    // Log del error pero continúa con la actualización
                    dbLogger.error('Error al eliminar la imagen de perfil antigua:', {err});
                }
            }

            const imagePath = `${this.imageBasePath}/${profilePicture.filename}`;

            await user.update({ profile_picture: imagePath });

            await user.reload();

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    };

    public async deleteProfilePicture(filters: UserFilters) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            const user = await existsUser(filters);

            if (!user) throw new AppError(404, "");

            await user.update({ profile_picture: null });

            await user.reload();

            return user;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    };
};