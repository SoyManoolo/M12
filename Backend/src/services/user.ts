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

            // Si el usuario ya tiene una foto de perfil, eliminarla
            if (userData.profile_picture && userData.profile_picture !== null && userData.profile_picture !== '') {
                console.log('Foto actual:', userData.profile_picture);
                // Construir la ruta absoluta desde la raíz del proyecto
                const oldPicturePath = path.join(process.cwd(), 'Backend', userData.profile_picture);
                console.log('Ruta completa para eliminar:', oldPicturePath);
                console.log('Directorio actual:', process.cwd());
                
                try {
                    if (fs.existsSync(oldPicturePath)) {
                        fs.unlinkSync(oldPicturePath);
                        console.log('Archivo eliminado exitosamente');
                    } else {
                        console.log('El archivo no existe en la ruta especificada');
                        // Intentar con una ruta alternativa
                        const altPath = path.join(process.cwd(), userData.profile_picture);
                        console.log('Intentando ruta alternativa:', altPath);
                        if (fs.existsSync(altPath)) {
                            fs.unlinkSync(altPath);
                            console.log('Archivo eliminado exitosamente de la ruta alternativa');
                        } else {
                            // Intentar con una tercera ruta
                            const thirdPath = path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(userData.profile_picture));
                            console.log('Intentando tercera ruta:', thirdPath);
                            if (fs.existsSync(thirdPath)) {
                                fs.unlinkSync(thirdPath);
                                console.log('Archivo eliminado exitosamente de la tercera ruta');
                            } else {
                                // Intentar con una cuarta ruta
                                const fourthPath = path.join(process.cwd(), 'media', 'images', path.basename(userData.profile_picture));
                                console.log('Intentando cuarta ruta:', fourthPath);
                                if (fs.existsSync(fourthPath)) {
                                    fs.unlinkSync(fourthPath);
                                    console.log('Archivo eliminado exitosamente de la cuarta ruta');
                                } else {
                                    // Intentar con una quinta ruta
                                    const fifthPath = path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(userData.profile_picture));
                                    console.log('Intentando quinta ruta:', fifthPath);
                                    if (fs.existsSync(fifthPath)) {
                                        fs.unlinkSync(fifthPath);
                                        console.log('Archivo eliminado exitosamente de la quinta ruta');
                                    } else {
                                        // Intentar con una sexta ruta
                                        const sixthPath = path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(userData.profile_picture));
                                        console.log('Intentando sexta ruta:', sixthPath);
                                        if (fs.existsSync(sixthPath)) {
                                            fs.unlinkSync(sixthPath);
                                            console.log('Archivo eliminado exitosamente de la sexta ruta');
                                        } else {
                                            // Intentar con una séptima ruta
                                            const seventhPath = path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(userData.profile_picture));
                                            console.log('Intentando séptima ruta:', seventhPath);
                                            if (fs.existsSync(seventhPath)) {
                                                fs.unlinkSync(seventhPath);
                                                console.log('Archivo eliminado exitosamente de la séptima ruta');
                                            } else {
                                                // Intentar con una octava ruta
                                                const eighthPath = path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(userData.profile_picture));
                                                console.log('Intentando octava ruta:', eighthPath);
                                                if (fs.existsSync(eighthPath)) {
                                                    fs.unlinkSync(eighthPath);
                                                    console.log('Archivo eliminado exitosamente de la octava ruta');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error al eliminar el archivo:', error);
                }
            } else {
                console.log('El usuario no tiene foto de perfil actual');
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
            if (userData.profile_picture && userData.profile_picture !== null && userData.profile_picture !== '') {
                console.log('Intentando eliminar foto de perfil:', userData.profile_picture);
                // Igual que en updateProfilePicture, probar varias rutas
                const rutas = [
                    path.join(process.cwd(), 'Backend', userData.profile_picture),
                    path.join(process.cwd(), userData.profile_picture),
                    path.join(process.cwd(), 'Backend', 'media', 'images', path.basename(userData.profile_picture)),
                    path.join(process.cwd(), 'media', 'images', path.basename(userData.profile_picture)),
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