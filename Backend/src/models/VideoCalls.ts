import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";
import { VideoCallAttributes } from "../types/custom";
import { VideoCallCreationAttributes } from "../types/custom";

export class VideoCalls extends Model<VideoCallAttributes, VideoCallCreationAttributes> implements VideoCallAttributes {
    call_id!: string;
    user1_id!: string;
    user2_id!: string;
    started_at!: Date;
    ended_at!: Date | null;
    call_duration!: number | null;
    status!: string;
    match_status!: boolean;
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
        timestamps: false,
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