import { AppError } from "../middlewares/errors/AppError";

export class PostService {
    public async createPost(user_id: string, description: string) {
        try {

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