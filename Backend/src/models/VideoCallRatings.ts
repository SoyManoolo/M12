import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";
import { VideoCalls } from "./VideoCalls.js"; // Asegúrate de importar este modelo

export class VideoCallRatings extends Model { }

VideoCallRatings.init(
    {
        rating_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        video_call_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: VideoCalls,
                key: "call_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        rater_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        rated_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "user_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
    },
    {
        sequelize,
        tableName: "video_call_ratings",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            {
                fields: ["video_call_id"],
                name: "idx_video_call_ratings_video_call_id",
            },
        ],
    }
);