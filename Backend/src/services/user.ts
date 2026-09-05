import { RefreshToken, User } from "../models";
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
    private readonly publicAttributes = [
        'user_id', 'username', 'name', 'surname', 'profile_picture', 'bio', 'created_at'
    ];
    private readonly adminAttributes = [
        ...this.publicAttributes, 'email', 'email_verified', 'is_moderator', 'active_video_call', 'updated_at', 'deleted_at'
    ];

    private toSafeUser(user: User) {
        const { password, ...safeUser } = user.get({ plain: true }) as UserAttributes;
        return safeUser;
    }

    private toPublicUser(user: User) {
        const data = user.get({ plain: true }) as UserAttributes;
        return {
            user_id: data.user_id,
            username: data.username,
            name: data.name,
            surname: data.surname,
            profile_picture: data.profile_picture,
            bio: data.bio,
            created_at: data.created_at
        };
    }

    private async authorizeAccountMutation(user: User, requesterId: string) {
        if (user.user_id === requesterId) return;

        const requester = await User.findByPk(requesterId);
        if (!requester || !requester.is_moderator) {
            throw new AppError(403, 'Forbidden');
        }
    }

    // Método para obtener todos los usuarios - LISTO
    public async getUsers(limit: number = 10, cursor?: string, attributes = this.publicAttributes) {
        try {
            dbLogger.info('[UserService] Getting all users');
            const queryOptions: any = {
                limit: limit + 1, // +1 para verificar si hay más páginas
                order: [['created_at', 'DESC']], // Ordenamiento explícito
                attributes,
            };

            if (cursor) {
                const lastUser = await User.findByPk(cursor);
                if (lastUser) {
                    queryOptions.where = {
                        created_at: {
                            [Op.lt]: lastUser.getDataValue("created_at")
                        }
                    };
                }
            }

            const users = await User.findAll(queryOptions);

            // Verificar si no hay usuarios
            if (!users || users.length === 0) {
                // No lanzar error 404 si no hay usuarios en la carga inicial, solo si es una búsqueda paginada y no hay más.
                // Considerar si este endpoint debe paginar o no. Por ahora, devuelve lo que encuentra.
                // throw new AppError(404, 'UsersNotFound');
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
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para obtener un usuario - LISTO
    public async getUser(filters: UserFilters) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, 'MissingUserFilters');
            };

            dbLogger.info(`[UserService] Getting user with filters: ${JSON.stringify(filters)}`);
            const user: User | null = await existsUser(filters);

            if (!user) {
                dbLogger.warn(`[UserService] User not found with filters: ${JSON.stringify(filters)}`);
                throw new AppError(404, 'UserNotFound');
            }

            return this.toPublicUser(user);
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error getting user: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[UserService] Unexpected error getting user: ${error}`);
            throw new AppError(500, 'InternalServerError');
        }
    };

    public async getCurrentUser(userId: string) {
        const user = await User.findByPk(userId);
        if (!user) throw new AppError(404, 'UserNotFound');
        return this.toSafeUser(user);
    }

    public async getAdminUsers(limit: number = 100, cursor?: string) {
        return this.getUsers(limit, cursor, this.adminAttributes);
    }

    // Método para editar un usuario
    public async updateUser(filters: UserFilters, updateData: UpdateUserData, requesterId: string) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, 'MissingUserFilters');
            };

            const user: User | null = await existsUser(filters);
            if (!user) {
                dbLogger.warn(`[UserService] User not found for update with filters: ${JSON.stringify(filters)}`);
                throw new AppError(404, 'UserNotFound');
            }

            await this.authorizeAccountMutation(user, requesterId);

            // Si se va a actualizar la contraseña, hashearla antes de guardar
            if (updateData.password) {
                updateData.password = await hash(updateData.password, 10);
            }

            dbLogger.info(`[UserService] Updating user with ID: ${user.user_id}`);
            const newUser: User = await user.update(updateData);

            if (!newUser) throw new AppError(500, 'UserUpdateFailed');

            await user.reload();

            if (updateData.password) {
                await RefreshToken.destroy({ where: { user_id: user.user_id } });
            }

            return this.toSafeUser(newUser);
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
    public async deleteUser(filters: UserFilters, requesterId: string) {
        try {
            const user: User | null = await existsUser(filters);

            if (!user) {
                dbLogger.warn(`[UserService] User not found for deletion with filters: ${JSON.stringify(filters)}`);
                throw new AppError(404, 'UserNotFound');
            }

            await this.authorizeAccountMutation(user, requesterId);

            dbLogger.info(`[UserService] Deleting user with ID: ${user.user_id}`);
            await RefreshToken.destroy({ where: { user_id: user.user_id } });
            await user.destroy();

            return this.toSafeUser(user);
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
    public async updateProfilePicture(filters: UserFilters, profilePicture: Express.Multer.File, requesterId: string) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, 'MissingUserFilters');
            };

            const user: User | null = await existsUser(filters);

            if (!user) throw new AppError(404, 'UserNotFound');

            await this.authorizeAccountMutation(user, requesterId);

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

            return this.toSafeUser(user);
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error updating profile picture: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[UserService] Unexpected error updating profile picture: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para eliminar la foto de perfil
    public async deleteProfilePicture(filters: UserFilters, requesterId: string) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, 'MissingUserFilters');
            };

            const user: User | null = await existsUser(filters);

            if (!user) throw new AppError(404, 'UserNotFound');

            await this.authorizeAccountMutation(user, requesterId);

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

            return this.toSafeUser(user);
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[UserService] Error deleting profile picture: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[UserService] Unexpected error deleting profile picture: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Nuevo método para buscar usuarios de forma flexible por username, name o surname
    public async searchUsers(searchTerm: string, limit: number = 20) {
        try {
            dbLogger.info(`[UserService] Searching users with term: ${searchTerm}`);

            // Usamos Op.iLike para búsqueda insensible a mayúsculas/minúsculas
            // Agregamos el comodín % para buscar coincidencias parciales al inicio y al final
            const searchPattern = `%${searchTerm}%`;

            const users = await User.findAll({
                where: {
                    [Op.or]: [
                        { username: { [Op.iLike]: searchPattern } },
                        { name: { [Op.iLike]: searchPattern } },
                        { surname: { [Op.iLike]: searchPattern } }
                    ]
                },
                attributes: this.publicAttributes,
                limit: limit,
                order: [
                    // Considerar un ordenamiento más relevante para búsqueda, por ejemplo por relevancia
                    // Por ahora, ordenamos por username alfabéticamente
                    ['username', 'ASC']
                ]
            });

            dbLogger.info(`[UserService] Found ${users.length} users for term: ${searchTerm}`);

            return users;
        } catch (error) {
            dbLogger.error(`[UserService] Error searching users: ${error}`);
            throw new AppError(500, 'UserSearchFailed');
        }
    }
};
