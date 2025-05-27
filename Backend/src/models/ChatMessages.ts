import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";
import { User } from "./User";
import { IChatMessages } from "../types/custom";

class ChatMessages extends Model<IChatMessages> implements IChatMessages {
    public chat_id!: string;
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
};

ChatMessages.init(
    {
        chat_id: {
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
            defaultValue: null,
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        }
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