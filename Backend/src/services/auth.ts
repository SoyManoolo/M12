import { AppError } from "../middlewares/errors/AppError";
import { User, RefreshToken, SessionRefreshToken } from "../models";
import { compare, hash } from "bcryptjs";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import { Op } from "sequelize";
import dbLogger from "../config/logger";
import { createHash, randomBytes } from 'node:crypto';
import { PasswordResetToken } from '../models';

export class AuthService {

    /** Send a one-time password-reset link without revealing whether the email exists. */
    public async requestPasswordReset(email: string): Promise<void> {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.EMAIL_FROM;
        const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');

        if (!apiKey || !from || !frontendUrl) {
            dbLogger.warn('[AuthService] Password reset email is not configured');
            return;
        }

        const user = await User.findOne({ where: { email: { [Op.iLike]: email.trim() } } });
        if (!user) return;

        const token = randomBytes(32).toString('base64url');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const reset = await PasswordResetToken.create({
            user_id: user.user_id,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
            used_at: null,
        });

        const link = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from,
                    to: [user.email],
                    subject: 'Restablece tu contraseña de FriendsGo',
                    text: `Hola ${user.name},\n\nUsa este enlace para cambiar tu contraseña. Caduca en una hora:\n${link}\n\nSi no lo solicitaste, ignora este correo.`,
                }),
            });
            if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
        } catch (error) {
            await reset.destroy();
            dbLogger.error('[AuthService] Password reset email delivery failed', { error });
        }
    }

    /** Replace a password with a valid one-time reset token and revoke existing sessions. */
    public async resetPassword(token: string, password: string): Promise<void> {
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const sequelize = PasswordResetToken.sequelize;
        if (!sequelize) throw new AppError(500, 'DatabaseUnavailable');

        await sequelize.transaction(async transaction => {
            const reset = await PasswordResetToken.findOne({
                where: {
                    token_hash: tokenHash,
                    used_at: null,
                    expires_at: { [Op.gt]: new Date() },
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!reset) throw new AppError(400, 'InvalidPasswordResetToken');

            const user = await User.findByPk(reset.user_id, { transaction });
            if (!user) throw new AppError(400, 'InvalidPasswordResetToken');

            await user.update({ password: await hash(password, 10) }, { transaction });
            await reset.update({ used_at: new Date() }, { transaction });
            await RefreshToken.destroy({ where: { user_id: user.user_id }, transaction });
            await SessionRefreshToken.destroy({ where: { user_id: user.user_id }, transaction });
            await PasswordResetToken.destroy({
                where: { user_id: user.user_id, reset_id: { [Op.ne]: reset.reset_id } },
                transaction,
            });
        });
    }

    private async createSession(user: User): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = new AuthToken().generateToken(user);
        const refreshToken = randomBytes(32).toString('base64url');
        const now = Date.now();
        await RefreshToken.create({
            token: accessToken,
            user_id: user.user_id,
            expires_at: new Date(now + 60 * 60 * 1000),
        });
        await SessionRefreshToken.create({
            user_id: user.user_id,
            token_hash: createHash('sha256').update(refreshToken).digest('hex'),
            expires_at: new Date(now + 30 * 24 * 60 * 60 * 1000),
        });
        return { accessToken, refreshToken };
    }

    public async loginWithGoogle(profile: { email: string; name: string; surname: string; picture?: string }): Promise<{ accessToken: string; refreshToken: string }> {
        let user = await User.findOne({ where: { email: { [Op.iLike]: profile.email } } });
        if (!user) {
            const base = (profile.email.split('@')[0] || 'friendsgo').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 35) || 'friendsgo';
            let username = base;
            while (await User.findOne({ where: { username } })) {
                username = `${base}_${randomBytes(3).toString('hex')}`.slice(0, 50);
            }
            user = await User.create({
                email: profile.email.toLowerCase(),
                username,
                name: profile.name.slice(0, 100) || username,
                surname: profile.surname.slice(0, 100) || 'FriendsGo',
                password: await hash(randomBytes(48).toString('base64url'), 10),
                email_verified: true,
                profile_picture: profile.picture ?? null,
            });
        } else if (!user.email_verified) {
            await user.update({ email_verified: true });
        }
        return this.createSession(user);
    }

    // Método para iniciar sesión
    public async login(id: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            dbLogger.info(`[AuthService] Login attempt for ID: ${id}`);

            // Encontrar al usuario por username o email
            const user = await User.findOne({ where: { [Op.or]: [{ username: id }, { email: id }] } });

            // Si no se encuentra el usuario, lanzar un error
            if (!user) {
                dbLogger.error(`[AuthService] User not found for ID: ${id}`);
                throw new AppError(404, 'UserNotFound')
            };

            // Verificar si la contraseña es correcta
            const correctPassword = await compare(password, user.getDataValue("password"));

            // Si la contraseña es incorrecta, lanzar un error
            if (!correctPassword) {
                dbLogger.error(`[AuthService] Incorrect password for user ID: ${id}`);
                throw new AppError(401, 'IncorrectPassword')
            };

            const session = await this.createSession(user);
            if (!session.accessToken) {
                dbLogger.error(`[AuthService] Token generation failed for user ID: ${id}`);
                throw new AppError(500, 'TokenGenerationError')
            };
            return session;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[AuthService] Error during login:", {error});
                throw error;
            };
            dbLogger.error("[AuthService] Unexpected error during login:", {error});
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para registrar un nuevo usuario
    public async register(email: string, username: string, name: string, surname: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            dbLogger.info(`[AuthService] Register attempt for email: ${email}`);

            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
            if (existingUser) {
                if (existingUser.email === email) {
                    dbLogger.error(`[AuthService] User with email already exists: ${email}`);
                    throw new AppError(409, 'UserEmailAlreadyExists');
                } else {
                    dbLogger.error(`[AuthService] User with username already exists: ${username}`);
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
                dbLogger.error("User creation failed unexpectedly."); // Log para depuración
                throw new AppError(500, 'UserCreationError');
            }

            const session = await this.createSession(newUser);
            if (!session.accessToken) {
                dbLogger.error(`[AuthService] Token generation failed for new user: ${email}`);
                throw new AppError(500, 'TokenGenerationError');
            }
            return session;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[AuthService] Error during registration: ${error.message}`);
                throw error;
            };
            dbLogger.error("[AuthService] Unexpected error during registration:", {error});
            throw new AppError(500, 'InternalServerError');
        };
    };

    public async logout(token: string, refreshToken?: string) {
        try {
            dbLogger.info(`[AuthService] Logout attempt`);

            // Encontrar el token en la base de datos
            const jwt = await RefreshToken.findOne({ where: { token } });

            // Si no se encuentra el token, lanzar un error
            if (!jwt) throw new AppError(404, 'TokenNotFound');

            // Destruir el token
            await jwt.destroy();

            if (refreshToken) {
                await SessionRefreshToken.destroy({
                    where: {
                        user_id: jwt.user_id,
                        token_hash: createHash('sha256').update(refreshToken).digest('hex'),
                    }
                });
            } else {
                await SessionRefreshToken.destroy({ where: { user_id: jwt.user_id } });
            }

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[AuthService] Error during logout:", {error});
                throw error;
            };
            dbLogger.error("[AuthService] Unexpected error during logout:", {error});
            throw new AppError(500, 'InternalServerError');
        };
    }
};
