import dotenv from "dotenv";
dotenv.config();

import { Server } from 'socket.io';
import { app } from "./app";
import { createServer } from "http";
import { chatEvents } from "./socket/ChatEvents";
import { videoCallEvents } from "./socket/VideoCall";

// Cargar variables de entorno desde el archivo .env

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    }
});

io.on("connection", (socket) => {
    chatEvents(socket, io);
    videoCallEvents(socket, io); // Añadir esta línea
});

// Iniciar el sistema de emparejamiento automático
let matchingInterval: NodeJS.Timeout;

function startMatchingSystem() {
    // Ejecutar el emparejamiento cada 10 segundos
    matchingInterval = setInterval(async () => {
        try {
            await VideoCallService.performMatchingRound(io);
        } catch (error) {
            console.error("Error en el proceso de emparejamiento:", error);
        }
    }, 5000);
}

// Iniciar el sistema cuando arranca el servidor
startMatchingSystem();

process.on('SIGINT', () => {
    if (matchingInterval) {
        clearInterval(matchingInterval);
    }
    process.exit(0);
});

const port = parseInt(process.env.PORT || "3000");

server.listen(port, () => { });

export { io }
import './services/chat';
import { VideoCallService } from "./services/videoCall";
