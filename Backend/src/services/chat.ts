import { ChatMessages } from "../models/ChatMessages";
import { User } from "../models/User";
import { AppError } from "../middlewares/errors/AppError";

export class ChatService {
    // Método para crear un nuevo mensaje
    public async createMessage(sender_id: string, receiver_id: string, content: string) {

    }

    // Método para obtener los mensajes de un chat
    public async getMessages(sender_id: string, receiver_id: string) {

    }

    // Método para editar un mensaje
    public async updateMessage(message_id: string, content: string) {

    }

    // Método para eliminar un mensaje
    public async deleteMessage(message_id: string) {

    }
}