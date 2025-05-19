import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { UserFilters, UpdateUserData } from '../types/custom';
import { Op } from "sequelize";
import fs from 'fs';
import path from 'path';

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

    // Función privada para eliminar la foto de perfil física
    private eliminarFotoPerfil(profile_picture: string) {
        if (!profile_picture) return;
        const rutas = [
            path.join(process.cwd(), 'Backend', profile_picture),
            path.join(process.cwd(), profile_picture),
            path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(profile_picture)),
            path.join(process.cwd(), 'media', 'images', path.basename(profile_picture)),
        ];
        for (const ruta of rutas) {
            try {
                if (fs.existsSync(ruta)) {
                    fs.unlinkSync(ruta);
                    console.log('Archivo eliminado exitosamente en:', ruta);
                    break;
                } else {
                    console.log('No existe archivo en:', ruta);
                }
            } catch (error) {
                console.error('Error al intentar eliminar en', ruta, error);
            }
        }
    }

    // Método para actualizar la foto de perfil
    public async updateProfilePicture(user_id: string, file: Express.Multer.File) {
        try {
            console.log('Buscando usuario:', user_id);
            const user = await existsUser({ user_id });
            if (!user) throw new AppError(404, "UserNotFound");

            const userData = user.toJSON();
            console.log('Usuario encontrado:', userData);
            console.log('Tipo de profile_picture:', typeof userData.profile_picture);
            console.log('Valor de profile_picture:', userData.profile_picture);

            // Eliminar la foto anterior si existe
            if (userData.profile_picture) {
                this.eliminarFotoPerfil(userData.profile_picture);
            }

            // Actualizar la ruta de la nueva foto de perfil
            const profilePicturePath = `${this.imageBasePath}/${file.filename}`;
            console.log('Nueva foto:', profilePicturePath);
            await user.update({ profile_picture: profilePicturePath });
            await user.reload(); // Recargar el usuario para obtener los datos actualizados

            return user;
        } catch (error) {
            console.error('Error en updateProfilePicture:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para eliminar la foto de perfil
    public async deleteProfilePicture(user_id: string) {
        try {
            const user = await existsUser({ user_id });
            if (!user) throw new AppError(404, "UserNotFound");

            const userData = user.toJSON();
            if (userData.profile_picture) {
                this.eliminarFotoPerfil(userData.profile_picture);
                await user.update({ profile_picture: null });
            }

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }
};