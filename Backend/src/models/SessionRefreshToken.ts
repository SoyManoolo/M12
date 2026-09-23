import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export class SessionRefreshToken extends Model {
    declare session_id: string;
    declare user_id: string;
    declare token_hash: string;
    declare expires_at: Date;
    declare created_at: Date;
}

SessionRefreshToken.init({
    session_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: User, key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    sequelize,
    tableName: 'session_refresh_tokens',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['token_hash'], name: 'idx_session_refresh_token_hash' },
        { fields: ['user_id', 'expires_at'], name: 'idx_session_refresh_user_expiry' },
    ],
});
