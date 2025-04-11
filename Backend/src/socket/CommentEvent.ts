import { Socket, Server } from "socket.io";
import { CommentService } from "../services/comment";

const commentService = new CommentService();

export function commentEvents(socket: Socket, io: Server) {
    socket.on("post-comment", async (data) => {

    });

    socket.on("comment-update", async (data) => {

    });

    socket.on("comment-delete", async (data) => {

    });
};