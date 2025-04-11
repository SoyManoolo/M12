import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";

export class UserService {
    // Método para editar un usuario
    public async updateUser(userId: string) {};

    // Método para eliminar un usuario
    public async deleteUser(userId: string) {};
};