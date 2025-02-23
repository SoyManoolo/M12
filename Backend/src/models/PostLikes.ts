import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { User } from "./User";
import { Post } from "./Post";

export class PostLikes extends Model { }

PostLikes.init(
    {
        like_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        post_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Post,
                key: "post_id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
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
    },
    {
        sequelize,
        tableName: "post_likes",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ["post_id", "user_id"],
                name: "idx_post_likes_post_id_user_id",
            },
        ],
    }
);