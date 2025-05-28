import { io, Socket } from "socket.io-client";
import axios from "axios";

// Interfaces para los tipos de datos
interface MessageData {
    message: {
        id: string;
        content: string;
        sender_id: string;
        receiver_id: string;
        is_delivered: boolean;
        delivered_at: string | null;
        read_at: string | null;
    };
}

interface DeliveryStatus {
    message_id: string;
    status: 'delivered';
    delivered_at: string;
}

interface ReadStatus {
    message_id: string;
    status: 'read';
    read_at: string;
}

// Función para obtener token mediante login
async function getToken(username: string, password: string): Promise<string> {
    try {
        const response = await axios.post('http://localhost:3000/auth/login', {
            id: username,
            password
        });
        return response.data.token;
    } catch (error) {
        console.error(`Error al obtener token para ${username}:`, error);
        throw error;
    }
}

// Función para esperar un tiempo
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para imprimir mensajes con formato
function logMessage(prefix: string, message: string, data?: any) {
    console.log(`\n${prefix} ${message}`);
    if (data) {
        console.log('📦 Detalles:', JSON.stringify(data, null, 2));
    }
}

// Función principal
async function main() {
    try {
        // Obtener tokens mediante login
        logMessage('🔑', 'Obteniendo tokens...');
        const jaiderToken = await getToken('Jaider', 'Jaider123');
        const erikToken = await getToken('Erik', 'Erik123');
        logMessage('✅', 'Tokens obtenidos correctamente');

        // Crear conexiones WebSocket para ambos usuarios
        const jaiderSocket: Socket = io("http://localhost:3000", {
            auth: { token: jaiderToken },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        const erikSocket: Socket = io("http://localhost:3000", {
            auth: { token: erikToken },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        // IDs de los usuarios (actualizados con los reales)
        const jaiderId = "2971d435-0539-492d-a2f5-b97df959f74e";
        const erikId = "1f406e20-c8a8-43a0-b502-038e67bede71";

        // Configurar eventos para Jaider
        jaiderSocket.on("connect", () => {
            logMessage('✅', 'Jaider conectado');
            jaiderSocket.emit("join-user", { userId: jaiderId, token: jaiderToken });
        });

        jaiderSocket.on("disconnect", () => {
            logMessage('❌', 'Jaider desconectado');
        });

        jaiderSocket.on("connect_error", (error) => {
            logMessage('❌', `Error de conexión de Jaider: ${error.message}`);
        });

        jaiderSocket.on("new-message", (data: MessageData) => {
            logMessage('📨', 'Jaider recibió mensaje:', {
                content: data.message.content,
                id: data.message.id,
                sender: data.message.sender_id,
                delivered: data.message.is_delivered,
                delivered_at: data.message.delivered_at,
                read_at: data.message.read_at
            });

            // Esperar un momento antes de marcar como entregado y leído
            setTimeout(() => {
                // Marcar mensaje como entregado y leído si Jaider es el receptor
                if (data.message.receiver_id === jaiderId) {
                    logMessage('🔄', 'Jaider marcando mensaje como entregado y leído...', { message_id: data.message.id });

                    // Enviar eventos con el formato correcto
                    jaiderSocket.emit("message-delivered", {
                        message_id: data.message.id,
                        status: 'delivered',
                        delivered_at: new Date().toISOString(),
                        token: jaiderToken
                    });

                    setTimeout(() => {
                        jaiderSocket.emit("message-read", {
                            message_id: data.message.id,
                            status: 'read',
                            read_at: new Date().toISOString(),
                            token: jaiderToken
                        });
                    }, 1000);
                }
            }, 1000);
        });

        jaiderSocket.on("message-delivery-status", (data: DeliveryStatus) => {
            logMessage('✓', 'Jaider - Mensaje entregado:', {
                message_id: data.message_id,
                delivered_at: data.delivered_at
            });
        });

        jaiderSocket.on("message-read-status", (data: ReadStatus) => {
            logMessage('✓✓', 'Jaider - Mensaje leído:', {
                message_id: data.message_id,
                read_at: data.read_at
            });
        });

        jaiderSocket.on("chat-message-sent", (data) => {
            logMessage("📤 Jaider (chat-message-sent)", "Mensaje enviado (confirmación)", data);
        });

        jaiderSocket.on("error", (data) => {
            logMessage("❌ Jaider (error)", "Error en socket", data);
        });

        // Configurar eventos para Erik
        erikSocket.on("connect", () => {
            logMessage('✅', 'Erik conectado');
            erikSocket.emit("join-user", { userId: erikId, token: erikToken });
        });

        erikSocket.on("disconnect", () => {
            logMessage('❌', 'Erik desconectado');
        });

        erikSocket.on("connect_error", (error) => {
            logMessage('❌', `Error de conexión de Erik: ${error.message}`);
        });

        erikSocket.on("new-message", (data: MessageData) => {
            logMessage('📨', 'Erik recibió mensaje:', {
                content: data.message.content,
                id: data.message.id,
                sender: data.message.sender_id,
                delivered: data.message.is_delivered,
                delivered_at: data.message.delivered_at,
                read_at: data.message.read_at
            });

            // Esperar un momento antes de marcar como entregado y leído
            setTimeout(() => {
                // Marcar mensaje como entregado y leído si Erik es el receptor
                if (data.message.receiver_id === erikId) {
                    logMessage('🔄', 'Erik marcando mensaje como entregado y leído...', { message_id: data.message.id });

                    // Enviar eventos con el formato correcto
                    erikSocket.emit("message-delivered", {
                        message_id: data.message.id,
                        status: 'delivered',
                        delivered_at: new Date().toISOString(),
                        token: erikToken
                    });

                    setTimeout(() => {
                        erikSocket.emit("message-read", {
                            message_id: data.message.id,
                            status: 'read',
                            read_at: new Date().toISOString(),
                            token: erikToken
                        });
                    }, 1000);
                }
            }, 1000);
        });

        erikSocket.on("message-delivery-status", (data: DeliveryStatus) => {
            logMessage('✓', 'Erik - Mensaje entregado:', {
                message_id: data.message_id,
                delivered_at: data.delivered_at
            });
        });

        erikSocket.on("message-read-status", (data: ReadStatus) => {
            logMessage('✓✓', 'Erik - Mensaje leído:', {
                message_id: data.message_id,
                read_at: data.read_at
            });
        });

        erikSocket.on("chat-message-sent", (data) => {
            logMessage("📤 Erik (chat-message-sent)", "Mensaje enviado (confirmación)", data);
        });

        erikSocket.on("error", (data) => {
            logMessage("❌ Erik (error)", "Error en socket", data);
        });

        // Función para enviar mensaje
        async function sendMessage(sender: Socket, receiverId: string, content: string) {
            logMessage('📤', `Enviando mensaje: ${content}`);
            sender.emit("chat-message", {
                data: {
                    receiver_id: receiverId,
                    content: content
                },
                token: sender === jaiderSocket ? jaiderToken : erikToken
            });
            // Esperar un poco para asegurar que el mensaje se procesa
            await sleep(1000);
        }

        // Esperar a que ambos estén conectados
        logMessage('⏳', 'Esperando conexión de usuarios...');
        await sleep(3000);

        // Prueba 1: Envío de mensaje simple
        logMessage('📝', 'Prueba 1: Envío de mensaje simple');
        await sendMessage(jaiderSocket, erikId, "¡Hola Erik! Este es un mensaje de prueba por WebSocket");
        await sleep(3000);

        // Prueba 2: Envío de mensaje con respuesta
        logMessage('📝', 'Prueba 2: Envío de mensaje con respuesta');
        await sendMessage(erikSocket, jaiderId, "¡Hola Jaider! Recibí tu mensaje");
        await sleep(3000);

        // Prueba 3: Envío de mensaje largo
        logMessage('📝', 'Prueba 3: Envío de mensaje largo');
        await sendMessage(jaiderSocket, erikId, "Este es un mensaje más largo para probar el manejo de mensajes extensos. Debería funcionar correctamente y mostrar todos los detalles de entrega y lectura.");
        await sleep(3000);

        // Prueba 4: Envío de mensaje con caracteres especiales
        logMessage('📝', 'Prueba 4: Envío de mensaje con caracteres especiales');
        await sendMessage(erikSocket, jaiderId, "¡Hola! ¿Cómo estás? �� Este mensaje tiene caracteres especiales: áéíóú ñ Ñ");
        await sleep(3000);

        // Prueba 5: Envío de mensajes rápidos
        logMessage('📝', 'Prueba 5: Envío de mensajes rápidos');
        for (let i = 1; i <= 3; i++) {
            await sendMessage(jaiderSocket, erikId, `Mensaje rápido ${i}`);
            await sleep(1000);
        }
        await sleep(3000);

        // Prueba 6: Desconexión y reconexión
        logMessage('📝', 'Prueba 6: Desconexión y reconexión');
        logMessage('🔄', 'Desconectando a Jaider...');
        jaiderSocket.disconnect();
        await sleep(3000);
        logMessage('🔄', 'Reconectando a Jaider...');
        jaiderSocket.connect();
        await sleep(3000);

        // Prueba 7: Envío de mensaje después de reconexión
        logMessage('📝', 'Prueba 7: Envío de mensaje después de reconexión');
        await sendMessage(jaiderSocket, erikId, "¡Hola! Me reconecté correctamente");
        await sleep(3000);

        // Prueba 8: Envío de mensajes en paralelo
        logMessage('📝', 'Prueba 8: Envío de mensajes en paralelo');
        await Promise.all([
            sendMessage(jaiderSocket, erikId, "Mensaje paralelo 1 de Jaider"),
            sendMessage(erikSocket, jaiderId, "Mensaje paralelo 1 de Erik")
        ]);
        await sleep(3000);

        // Cerrar la conexión después de todas las pruebas
        logMessage('🔌', 'Cerrando conexiones...');
        jaiderSocket.disconnect();
        erikSocket.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("Error en la ejecución:", error);
        process.exit(1);
    }
}

// Ejecutar el script
main();