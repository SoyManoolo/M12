import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";
import { VideoCallAttributes } from "../types/custom";
import { VideoCallCreationAttributes } from "../types/custom";

export class VideoCalls extends Model<VideoCallAttributes, VideoCallCreationAttributes> implements VideoCallAttributes {
    declare call_id: string;
    declare user1_id: string;
    declare user2_id: string;
    declare started_at: Date;
    declare ended_at: Date | null;
    declare call_duration: number | null;
    declare status: string;
    declare match_status: boolean;
}

VideoCalls.init(
    {
        call_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user1_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: "user_id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        user2_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: User, key: "user_id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        started_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        ended_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        call_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: "active",
        },
        match_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "video_calls",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
            {
                fields: ["user1_id"],
                name: "idx_video_calls_user1_id",
            },
            {
                fields: ["user2_id"],
                name: "idx_video_calls_user2_id",
            },
        ],
    }
);
