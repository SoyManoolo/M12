// Cargar variables de entorno SOLO en desarrollo
// Railway inyecta las variables directamente en producción
console.log('[DEBUG] 1. Iniciando server.ts');
console.log('[DEBUG] 2. NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG] 3. DATABASE_URL disponible?:', !!process.env.DATABASE_URL);

if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG] 4. Cargando dotenv...');
    const dotenv = require('dotenv');
    dotenv.config();
    console.log('[DEBUG] 5. Dotenv cargado');
}

console.log('[DEBUG] 6. Importando dependencias...');
import { Server } from 'socket.io';
import { app } from "./app";
import { createServer } from "http";
import { chatEvents } from "./socket/ChatEvents";
import { videoCallEvents } from "./socket/VideoCallEvents";
import './services/chat';
import { VideoCallService } from "./services/videoCall";

console.log('[DEBUG] 7. Dependencias importadas correctamente');

// Cargar variables de entorno desde el archivo .env

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            'https://friendsgofrontend.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000'
        ],
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
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
console.log('[DEBUG] 8. Iniciando matching system...');
startMatchingSystem();

process.on('SIGINT', () => {
    if (matchingInterval) {
        clearInterval(matchingInterval);
    }
    process.exit(0);
});

const port = parseInt(process.env.PORT || "3000");
console.log('[DEBUG] 9. Iniciando servidor en puerto:', port);

server.listen(port, () => {
    console.log('[DEBUG] 10. ✅ Servidor escuchando en puerto:', port);
});

export { io }

