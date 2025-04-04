import { Op } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { User } from "../models";
import { compare, hash } from "bcryptjs";
import { AuthToken } from "../middlewares/validation/authentication/jwt";

export class AuthService {
    public async exists(identifier: string) {
        try {
            return await User.findOne({
                where: {
                    [Op.or]: [
                        { email: identifier },
                        { username: identifier }
                    ]
                }
            })
        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        }
    }

    public async login(identifier: string, password: string): Promise<string> {
        try {
            const user = await this.exists(identifier);

            if (!user) throw new AppError(404, 'UserNotFound');

            const correctPassword = await compare(password, user.dataValues.password);

            if (!correctPassword) throw new AppError(401, 'IncorrectPassword');

            const token = new AuthToken().generateToken(user);

            return token;
        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        }
    }

    public async register(email: string, username: string, name: string, surname: string, password: string): Promise<string> {
        try {
            const userEmail = await this.exists(email);
            if (userEmail) throw new AppError(409, 'UserEmailAlreadyExists');

            const userUsername = await this.exists(username);
            if (userUsername) throw new AppError(409, 'UserUsernameAlreadyExists');

            const hashedPassword = await hash(password, 10);

            const user = await User.create({
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
            throw new AppError(500, 'InternalServerError');
        }
    }
}