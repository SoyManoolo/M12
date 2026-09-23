import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class PasswordResetToken extends Model {
    declare reset_id: string;
    declare user_id: string;
    declare token_hash: string;
    declare expires_at: Date;
    declare used_at: Date | null;
    declare created_at: Date;
}

PasswordResetToken.init({
    reset_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    token_hash: { type: DataTypes.STRING(64), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    tableName: 'password_reset_tokens',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['token_hash'], name: 'idx_password_reset_token_hash' },
        { fields: ['user_id', 'expires_at'], name: 'idx_password_reset_user_expiry' }
    ]
});
