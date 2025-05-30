import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";
import { FriendRequestAttributes } from "../types/custom";
import { FriendRequestCreationAttributes } from "../types/custom";

export class FriendRequest extends Model<FriendRequestAttributes, FriendRequestCreationAttributes> {}

FriendRequest.init(
    {
        request_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        receiver_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "pending",
        },
    },
    {
        sequelize,
        tableName: "friend_requests",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            {
                fields: ["sender_id"],
                name: "idx_sender_id",
            },
            {
                fields: ["receiver_id"],
                name: "idx_receiver_id",
            },
        ],
    }
);