import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { UserFilters, UpdateUserData, UserAttributes } from '../types/custom';
import { Op } from "sequelize";
import path from "path";
import fs from "fs";
import dbLogger from "../config/logger";
import { hash } from "bcryptjs";

export class UserService {
    private readonly imageBasePath: string = '/media/images';

    // Método para obtener todos los usuarios - LISTO
    public async getUsers(limit: number = 10, cursor?: string) {
        try {
            dbLogger.info('[UserService] Getting all users');
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
            const hasNextPage: boolean = users.length > limit;

            // Recortar el array si obtenemos uno extra para determinar hasNextPage
            const resultUsers: User[] = hasNextPage ? users.slice(0, limit) : users;

            // Determinar el próximo cursor
            const nextCursor: string | null = hasNextPage ? resultUsers[resultUsers.length - 1].dataValues.user_id : null;

            return {
                users: resultUsers,
                hasNextPage,
                nextCursor
            };
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error getting all users: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[UserService] Unexpected error getting all users: ${error}`);
            throw new AppError(500, 'Error interno del servidor');
        }
    }

    // Método para obtener un usuario - LISTO
    public async getUser(filters: UserFilters) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            dbLogger.info(`[UserService] Getting user with filters: ${JSON.stringify(filters)}`);
            const user: User | null = await existsUser(filters);

            if (!user) {
                dbLogger.warn(`[UserService] User not found with filters: ${JSON.stringify(filters)}`);
                throw new AppError(404, "Usuario no encontrado");
            }

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error getting user: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[UserService] Unexpected error getting user: ${error}`);
            throw new AppError(500, 'InternalServerError');
        }
    };

    // Método para editar un usuario
    public async updateUser(filters: UserFilters, updateData: UpdateUserData) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            const user: User | null = await existsUser(filters);
            if (!user) {
                dbLogger.warn(`[UserService] User not found for update with filters: ${JSON.stringify(filters)}`);
                throw new AppError(404, "Usuario no encontrado");
            }

            // Si se va a actualizar la contraseña, hashearla antes de guardar
            if (updateData.password) {
                updateData.password = await hash(updateData.password, 10);
            }

            dbLogger.info(`[UserService] Updating user with ID: ${user.user_id}`);
            const newUser: User = await user.update(updateData);

            if (!newUser) throw new AppError(404, "");

            await user.reload();

            return newUser;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error updating user: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[UserService] Unexpected error updating user: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para eliminar un usuario
    public async deleteUser(filters: UserFilters) {
        try {
            const user: User | null = await existsUser(filters);

            if (!user) {
                dbLogger.warn(`[UserService] User not found for deletion with filters: ${JSON.stringify(filters)}`);
                throw new AppError(404, "Usuario no encontrado");
            }

            dbLogger.info(`[UserService] Deleting user with ID: ${user.user_id}`);
            await user.destroy();

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error deleting user: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[UserService] Unexpected error deleting user: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    private deletionLogic(profilePicturePath: string | null) {
        if (!profilePicturePath) return;

        const rutas: string [] = [
            path.join(process.cwd(), 'Backend', profilePicturePath),
            path.join(process.cwd(), profilePicturePath),
            path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(profilePicturePath)),
            path.join(process.cwd(), 'media', 'images', path.basename(profilePicturePath)),
        ];

        for (const ruta of rutas) {
            try {
                if (fs.existsSync(ruta)) {
                    fs.unlinkSync(ruta);
                    dbLogger.info('Archivo eliminado exitosamente en:', { ruta });
                    break;
                }
            } catch (err) {
                dbLogger.error('Error al eliminar imagen de perfil:', { ruta, err });
            }
        }
    }

    // Método para actualizar la foto de perfil de un usuario
    public async updateProfilePicture(filters: UserFilters, profilePicture: Express.Multer.File) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "Se requieren filtros para identificar al usuario");
            };

            const user: User | null = await existsUser(filters);

            if (!user) throw new AppError(404, "Usuario no encontrado");

            // Eliminar la imagen anterior si existe
            const userData: UserAttributes = user.toJSON();
            if (userData.profile_picture) {
                this.deletionLogic(userData.profile_picture);
            }

            // Actualizar con la nueva imagen
            const imagePath: string = `${this.imageBasePath}/${profilePicture.filename}`;
            dbLogger.info(`[UserService] Updating profile picture for user ID: ${user.user_id}`);
            await user.update({ profile_picture: imagePath });
            await user.reload();

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error updating profile picture: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[UserService] Unexpected error updating profile picture: ${error}`);
            throw new AppError(500, 'Error interno del servidor');
        };
    };

    // Método para eliminar la foto de perfil
    public async deleteProfilePicture(filters: UserFilters) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "Se requieren filtros para identificar al usuario");
            };

            const user: User | null = await existsUser(filters);

            if (!user) throw new AppError(404, "Usuario no encontrado");

            // Guardamos la ruta antes de actualizar
            const userData: UserAttributes = user.toJSON();
            const oldProfilePicture: string | null = userData.profile_picture;

            // Primero eliminamos la referencia en la base de datos
            dbLogger.info(`[UserService] Deleting profile picture for user ID: ${user.user_id}`);
            await user.update({ profile_picture: null });

            // Después eliminamos el archivo físico si existía
            if (oldProfilePicture) {
                this.deletionLogic(oldProfilePicture);
            }

            await user.reload();

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error deleting profile picture: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[UserService] Unexpected error deleting profile picture: ${error}`);
            throw new AppError(500, 'Error interno del servidor');
        };
    };
};