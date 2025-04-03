import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";

export class UserBlocks extends Model { }

UserBlocks.init({
    block_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    blocker_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: "user_id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    },
    blocked_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: "user_id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    }
},
    {
        sequelize,
        tableName: "user_blocks",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: [ "blocker_id", "blocked_id" ],
                name: "idx_blocker_id_blocked_id"
            }
        ]
    })