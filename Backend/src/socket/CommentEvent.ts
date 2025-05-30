import { Socket, Server } from "socket.io";
import { CommentService } from "../services/comment";

const commentService = new CommentService();

export function commentEvents(socket: Socket, io: Server) {
    socket.on("post-comment", async (data) => {
        try {

        } catch (error) {

        }
    });

    socket.on("comment-update", async (data) => {
        try {

        } catch (error) {
            
        }
    });

    socket.on("comment-delete", async (data) => {
        try {

        } catch (error) {
            
        }
    });
};