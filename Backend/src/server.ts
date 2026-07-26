// Cargar variables de entorno ANTES de cualquier importación
import dotenv from 'dotenv';
dotenv.config();

import { env } from './config/env';

import { Server } from 'socket.io';
import { app } from "./app";
import { createServer } from "http";
import { chatEvents } from "./socket/ChatEvents";
import { videoCallEvents } from "./socket/VideoCallEvents";
import './services/chat';
import { VideoCallService } from "./services/videoCall";
import { initializeDatabase } from "./config/database";
import dbLogger from './config/logger';
import { ALLOWED_ORIGINS } from './config/cors';

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
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
            dbLogger.error("Error en el proceso de emparejamiento:", { error });
        }
    }, 5000);
}

process.on('SIGINT', () => {
    if (matchingInterval) {
        clearInterval(matchingInterval);
    }
    process.exit(0);
});

const port: number = env.PORT;
const host = '0.0.0.0'; // CRÍTICO: Railway requiere escuchar en 0.0.0.0

async function startServer() {
    try {
        await initializeDatabase();
        dbLogger.info('Base de datos inicializada');
        startMatchingSystem();

        server.listen(port, host, () => {
            dbLogger.info('Servidor HTTP iniciado', {
                host,
                port,
                env: env.NODE_ENV
            });
        });
    } catch (error) {
        dbLogger.error('Error al inicializar base de datos', {
            error: error instanceof Error ? error.message : error
        });
        process.exit(1);
    }
}

void startServer();

server.on('error', (error: any) => {
    dbLogger.error('[ERROR] Error en el servidor:', error);
    if (error.code === 'EADDRINUSE') {
        dbLogger.error(`[ERROR] Puerto ${port} ya está en uso`);
    }
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    dbLogger.error('[FATAL] Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    dbLogger.error('[FATAL] Unhandled Rejection at:', {promise, reason});
    process.exit(1);
});

export { io }

