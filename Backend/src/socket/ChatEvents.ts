import { Socket, Server } from "socket.io";
import { ChatService } from "../services/chat";

const chatService = new ChatService();

export function chatEvents(socket: Socket, io: Server) {
    socket.on("chat-message", async (data) => {
        try {
            const { sender_id, receiver_id, content } = data;

            const result = await chatService.createMessage(sender_id, receiver_id, content);

        } catch (error) {

        };
    });

    socket.on("message-update", async (data) => {
        try {
            const { message_id, content } = data;

            const result = await chatService.updateMessage(message_id, content);
        } catch (error) {

        };
    });

    socket.on("message-delete", async (data) => {
        try {
            const { message_id } = data;

            const result = await chatService.deleteMessage(message_id);
        } catch (error) {

        };
    });
};