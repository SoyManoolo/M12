import { AppError } from "../middlewares/errors/AppError";
import { User, JWT } from "../models";
import { compare, hash } from "bcryptjs";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import { Op } from "sequelize";
import FileManagementService from './FileManagementService';

export class AuthService {

    // Método para iniciar sesión
    public async login(id: string, password: string): Promise<string> {
        try {
            const user = await User.findOne({ where: { [Op.or]: [{ username: id }, { email: id }] } });

            if (!user) throw new AppError(404, 'UserNotFound');

            const correctPassword = await compare(password, user.dataValues.password);

            if (!correctPassword) throw new AppError(401, 'IncorrectPassword');

            const token = new AuthToken().generateToken(user);

            if (!token) throw new AppError(500, 'TokenGenerationError');

            await JWT.findOrCreate({
                where: { token },
                defaults: { token }
            });

            return token;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            console.error("Login error:", error);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para registrar un nuevo usuario
    public async register(email: string, username: string, name: string, surname: string, password: string): Promise<string> {
        try {
            const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
            if (existingUser) {
                if (existingUser.dataValues.email === email) {
                    throw new AppError(409, 'UserEmailAlreadyExists');
                } else {
                    throw new AppError(409, 'UserUsernameAlreadyExists');
                }
            }

            const hashedPassword = await hash(password, 10);

            const newUser = await User.create({
                email,
                username,
                name,
                surname,
                password: hashedPassword
            });

            if (!newUser) {
                 console.error("User creation failed unexpectedly.");
                 throw new AppError(500, 'UserCreationError');
            }

            // Crear directorio para el usuario
            await FileManagementService.createUserDirectory(newUser.dataValues.user_id);

            const token = new AuthToken().generateToken(newUser);

            if (!token) {
                 throw new AppError(500, 'TokenGenerationError');
            }

            await JWT.findOrCreate({
                where: { token },
                defaults: { token }
            });

            return token;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    };

    public async logout(token: string) {
        try {
            const jwt = await JWT.findOne({ where: { token } });

            if (!jwt) throw new AppError(404, 'TokenNotFound');

            await jwt.destroy();

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    }
};