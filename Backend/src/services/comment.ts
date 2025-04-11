import { PostComments } from '../models/PostComments';
import { User } from '../models/User';
import { AppError } from '../middlewares/errors/AppError';
import { Post } from '../models/Post';

export class CommentService {
    // Método para crear un nuevo comentario
    public async createComment(post_id: string, user_id: string, content: string) {

    };

    // Método para editar un comentario
    public async getComments(post_id: string) {

    };

    // Método para eliminar un comentario
    public async deleteComment(comment_id: string) {

    };
};