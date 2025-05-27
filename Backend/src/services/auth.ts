import { AppError } from "../middlewares/errors/AppError";
import { User, JWT } from "../models";
import { compare, hash } from "bcryptjs";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import { Op } from "sequelize";
import dbLogger from "../config/logger";

export class AuthService {

    // Método para iniciar sesión
    public async login(id: string, password: string): Promise<string> {
        try {
            dbLogger.info(`[AuthService] Login attempt for ID: ${id}`);

            // Encontrar al usuario por username o email
            const user = await User.findOne({ where: { [Op.or]: [{ username: id }, { email: id }] } });

            // Si no se encuentra el usuario, lanzar un error
            if (!user) throw new AppError(404, 'UserNotFound');

            // Verificar si la contraseña es correcta
            const correctPassword = await compare(password, user.getDataValue("password"));

            // Si la contraseña es incorrecta, lanzar un error
            if (!correctPassword) throw new AppError(401, 'IncorrectPassword');

            // Generar el token de autenticación
            const token: string = new AuthToken().generateToken(user);

            // Verificar si el token fue generado correctamente
            if (!token) throw new AppError(500, 'TokenGenerationError');

            // Guardar el token en la base de datos
            await JWT.findOrCreate({
                where: { token },
                defaults: { token }
            });

            return token;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[AuthService] Error during login: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[AuthService] Unexpected error during login: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para registrar un nuevo usuario
    public async register(email: string, username: string, name: string, surname: string, password: string): Promise<string> {
        try {
            dbLogger.info(`[AuthService] Register attempt for email: ${email}`);

            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
            if (existingUser) {
                if (existingUser.email === email) {
                    throw new AppError(409, 'UserEmailAlreadyExists');
                } else {
                    throw new AppError(409, 'UserUsernameAlreadyExists');
                }
            }

            // Hashear la contraseña
            const hashedPassword = await hash(password, 10);

            // Crear el nuevo usuario
            const newUser: User = await User.create({
                email,
                username,
                name,
                surname,
                password: hashedPassword
            });

            // Verificar si la creación del usuario fue exitosa
            if (!newUser) {
                 console.error("User creation failed unexpectedly."); // Log para depuración
                 throw new AppError(500, 'UserCreationError');
            }

            // Generar el token de autenticación
            const token = new AuthToken().generateToken(newUser);

            // Verificar si el token fue generado correctamente
            if (!token) {
                 throw new AppError(500, 'TokenGenerationError');
            }

            // Guardar el token en la base de datos
            await JWT.findOrCreate({
                where: { token },
                defaults: { token }
            });

            return token;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[AuthService] Error during registration: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[AuthService] Unexpected error during registration: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    public async logout(token: string) {
        try {
            dbLogger.info(`[AuthService] Logout attempt`);

            // Encontrar el token en la base de datos
            const jwt = await JWT.findOne({ where: { token } });

            // Si no se encuentra el token, lanzar un error
            if (!jwt) throw new AppError(404, 'TokenNotFound');

            // Destruir el token
            await jwt.destroy();

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[AuthService] Error during logout: ${error.message}`);
                throw error;
            };
            dbLogger.error(`[AuthService] Unexpected error during logout: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    }
};