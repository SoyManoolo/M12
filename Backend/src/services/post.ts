import { AppError } from "../middlewares/errors/AppError";
import { Post } from "../models";

export class PostService {
    public async createPost(user_id: string, description: string) {
        try {
            const post = await Post.create({
                user_id,
                description
            })
            return post;
        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };

    public async getPosts() {
        try {

        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };
    public async updatePost() {
        try {

        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };
    public async deletePost() {
        try {

        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };
}