import { AppError } from "../middlewares/errors/AppError";
import { User } from "../models";
import { compare, hash } from "bcryptjs";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import { existsUser } from "../utils/modelExists";

export class AuthService {

    public async login(id: string, password: string): Promise<string> {
        try {
            const user = await existsUser({username: id});

            if (!user) throw new AppError(404, 'UserNotFound');

            const correctPassword = await compare(password, user.dataValues.password);

            if (!correctPassword) throw new AppError(401, 'IncorrectPassword');

            const token = new AuthToken().generateToken(user);

            if (!token) throw new AppError(500, 'TokenGenerationError');

            return token;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    };

    public async register(email: string, username: string, name: string, surname: string, password: string): Promise<string> {
        try {
            const user = await existsUser({email, username});
            if (user) throw new AppError(409, 'UserEmailAlreadyExists');

            const hashedPassword = await hash(password, 10);

            await User.create({
                email,
                username,
                name,
                surname,
                password: hashedPassword
            });

            if (!user) throw new AppError(500, 'InternalServerError');

            const token = new AuthToken().generateToken(user);

            if (!token) throw new AppError(500, 'TokenGenerationError');

            return token;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(500, 'InternalServerError');
        };
    };
};