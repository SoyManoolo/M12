import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";

export class Notifications extends Model { };

Notifications.init(
    {
        notification_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [["friend_request", "message", "comment", "post"]],
            },
        },
        related_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "notifications",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            {
                fields: ["user_id"],
                name: "idx_notifications_user_id",
            },
        ],
    }
);