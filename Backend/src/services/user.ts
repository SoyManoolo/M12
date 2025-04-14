import { User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";

export class UserService {
    // Método para obtener todos los usuarios
    public async getUsers() {
        const users = await User.findAll();
        return users;
    };

    // Método para obtener un usuario
    public async getUser(userId: string) {

    };

    // Método para editar un usuario
    public async updateUser(userId: string) {

    };

    // Método para eliminar un usuario
    public async deleteUser(userId: string) {
        const user = await existsUser(userId)
    };
};