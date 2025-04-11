import { Socket, Server } from "socket.io";
import { CommentService } from "../services/comment";

export function chatEvents(socket: Socket, io: Server) {
    socket.on("chat-message", async (data) => {

    })

    socket.on("message-update", async (data) => {

    })

    socket.on("message-delete", async (data) => {

    })
}