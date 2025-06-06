import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";
import { PostCreationAttributes } from "../types/custom";
import { PostAttributes } from "../types/custom";

export class Post extends Model <PostAttributes, PostCreationAttributes>{};

Post.init(
    {
        post_id: {
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
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        media: {
            type: DataTypes.STRING(255),
            allowNull: true,
        }
    },
    {
        sequelize,
        tableName: "posts",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        paranoid: true,
        indexes: [
            {
                fields: ["user_id"],
                name: "idx_posts_user_id",
            },
        ],
    }
);