import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";
import { FriendsAttributes } from "../types/custom";
import { FriendsCreationAttributes } from "../types/custom";

export class Friends extends Model<FriendsAttributes, FriendsCreationAttributes> {}

Friends.init(
    {
        friendship_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user1_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        user2_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
    },
    {
        sequelize,
        tableName: "friends",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            {
                fields: ["user1_id"],
                name: "idx_user1_id",
            },
            {
                fields: ["user2_id"],
                name: "idx_user2_id",
            },
        ],
    }
);