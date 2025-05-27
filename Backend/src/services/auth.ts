import { AppError } from "../middlewares/errors/AppError";
import { User, JWT } from "../models";
import { compare, hash } from "bcryptjs";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import { Op } from "sequelize";

export class AuthService {

    // Método para iniciar sesión
    public async login(id: string, password: string): Promise<string> {
        try {
            // Encontrar al usuario por username o email
            const user = await User.findOne({ where: { [Op.or]: [{ username: id }, { email: id }] } });

            // Si no se encuentra el usuario, lanzar un error
            if (!user) throw new AppError(404, 'UserNotFound');

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
                throw error;
            };
            console.error("Login error:", error);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para registrar un nuevo usuario
    public async register(email: string, username: string, name: string, surname: string, password: string): Promise<string> {
        try {
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
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    };

    public async logout(token: string) {
        try {
            // Encontrar el token en la base de datos
            const jwt = await JWT.findOne({ where: { token } });

            // Si no se encuentra el token, lanzar un error
            if (!jwt) throw new AppError(404, 'TokenNotFound');

            // Destruir el token
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