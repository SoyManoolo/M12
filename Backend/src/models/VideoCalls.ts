import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import { User } from "./User";

export class VideoCalls extends Model { }

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