import { sequelize } from "../config/database";
import { Model, DataTypes, Optional } from "sequelize";

// Interfaz para los atributos del modelo
interface UserAttributes {
    user_id: string;
    name: string;
    surname: string;
    username: string;
    email: string;
    password: string;
    profile_picture?: string | null;
    bio?: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    active_video_call: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}

// Interfaz para la creación del modelo
interface UserCreationAttributes extends Optional<UserAttributes, 'user_id' | 'profile_picture' | 'bio' | 'email_verified' | 'is_moderator' | 'active_video_call' | 'created_at' | 'updated_at' | 'deleted_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public user_id!: string;
    public name!: string;
    public surname!: string;
    public username!: string;
    public email!: string;
    public password!: string;
    public profile_picture!: string | null;
    public bio!: string | null;
    public email_verified!: boolean;
    public is_moderator!: boolean;
    public active_video_call!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

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
        profile_picture: {
            type: DataTypes.STRING(255),
            allowNull: true,
            // validate: { isUrl: true },
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