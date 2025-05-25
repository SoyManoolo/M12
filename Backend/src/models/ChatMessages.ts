import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";
import { User } from "./User";

export interface IChatMessages {
    id?: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_delivered: boolean;
    delivered_at: Date | null;
    read_at: Date | null;
    created_at?: Date;
    updated_at?: Date;
    sender?: User;
    receiver?: User;
}

class ChatMessages extends Model<IChatMessages> implements IChatMessages {
    public id!: string;
    public sender_id!: string;
    public receiver_id!: string;
    public content!: string;
    public is_delivered!: boolean;
    public delivered_at!: Date | null;
    public read_at!: Date | null;
    public created_at!: Date;
    public updated_at!: Date;
    public sender?: User;
    public receiver?: User;
}

ChatMessages.init(
  {
        id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
        is_delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
        },
        delivered_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "chat_messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["sender_id", "receiver_id"],
        name: "idx_chat_messages_sender_receiver",
      },
    ],
  }
);

export default ChatMessages;