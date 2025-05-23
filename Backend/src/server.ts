import dotenv from "dotenv";
import { Server } from 'socket.io';
import { app } from "./app";
import { createServer } from "http";

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

const port = parseInt(process.env.PORT || "3000");

server.listen(port, () => {});

export { io }
import './services/chat';