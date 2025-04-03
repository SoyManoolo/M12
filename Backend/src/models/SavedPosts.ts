import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";
import { Post } from "./Post";

export class SavedPosts extends Model {}

SavedPosts.init(
  {
    save_id: {
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
  },
  {
    sequelize,
    tableName: "saved_posts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      {
        fields: ["user_id"],
        name: "idx_saved_posts_user_id",
      },
      {
        unique: true,
        fields: ["user_id", "post_id"],
        name: "idx_saved_posts_user_id_post_id",
      },
    ],
  }
);