import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";

export class User extends Model { }

User.init(
    {
        user_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: true },
        },
        surname: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: true },
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: { notEmpty: true },
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: { isEmail: true, notEmpty: true },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: { notEmpty: true },
        },
        profile_picture_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: { isUrl: true },
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_moderator: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        active_video_call: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
    },
    {
        sequelize,
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["email"],
                name: "idx_users_email"
            },
            {
                unique: true,
                fields: ["username"],
                name: "idx_users_username"
            },
        ],
    }
);