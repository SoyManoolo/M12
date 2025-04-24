import { Socket, Server } from "socket.io";
import { ChatService } from "../services/chat";

const chatService = new ChatService();

export function chatEvents(socket: Socket, io: Server) {
    socket.on("join-user", (userId: string) => {
        socket.join(userId);
    });

    socket.on("chat-message", async (data) => {
        try {
            const { sender_id, receiver_id, content } = data;

            const result = await chatService.createMessage(sender_id, receiver_id, content);

            io.to(sender_id).emit("chat-message-sent", {
                success: true,
                message: result,
            });

            io.to(receiver_id).emit("new-message", {
                message: result,
                sender_id
            });

        } catch (error) {
            socket.emit("send-message-error", {
                success: false,
                message: "Error sending message",
            });
        };
    });

    socket.on("message-update", async (data) => {
        try {
            const { sender_id, receiver_id, message_id, content } = data;

            const result = await chatService.updateMessage(message_id, content);

            io.to(sender_id).emit("chat-message-sent", {
                success: true,
                message: result,
            });

            io.to(receiver_id).emit("new-message", {
                message: result,
                sender_id
            });
        } catch (error) {
            socket.emit("update-error", {
                success: false,
                message: "Error updating message",
            });
        };
    });

    socket.on("message-delete", async (data) => {
        try {
            const { message_id, sender_id, receiver_id } = data;

            const result = await chatService.deleteMessage(message_id);

            io.to(sender_id).emit("message-deleted", {
                success: true,
                message_id
            });

            io.to(receiver_id).emit("message-deleted", {
                message_id
            });
        } catch (error) {
            socket.emit("update-error", {
                success: false,
                message: "Error deleting message",
            });
        };
    });
};