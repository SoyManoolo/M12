import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";
import { User } from "./User";

export class ContentModeration extends Model {};

ContentModeration.init(
  {
    moderation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    moderator_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    reported_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    report_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    action_taken: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "content_moderation",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      {
        fields: ["reported_user_id"],
        name: "idx_reported_user_id",
      },
    ],
  }
);