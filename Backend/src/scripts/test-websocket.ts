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

// Función principal
async function main() {
    try {
        // Obtener tokens mediante login
        console.log("🔑 Obteniendo tokens...");
        const adminToken = await getToken('admin', 'admin123');
        const testUserToken = await getToken('testuser', 'Test123!');
        console.log("✅ Tokens obtenidos correctamente");

        // Crear conexiones WebSocket para ambos usuarios
        const adminSocket: Socket = io("http://localhost:3000", {
            auth: { token: adminToken }
        });

        const testUserSocket: Socket = io("http://localhost:3000", {
            auth: { token: testUserToken }
        });

        // IDs de los usuarios
        const adminId = "b4ae9cb8-0c9f-4f1e-8466-cb8ceaa6fb73";
        const testUserId = "39837e9d-8cb2-486a-902d-a810ca852a23";

        // Configurar eventos para el admin
        adminSocket.on("connect", () => {
            console.log("✅ Admin conectado");
            adminSocket.emit("join-user", { userId: adminId, token: adminToken });
        });

        adminSocket.on("new-message", (data: MessageData) => {
            console.log("📨 Admin recibió mensaje:", data.message.content);
        });

        adminSocket.on("message-delivery-status", (data: DeliveryStatus) => {
            console.log("✓ Admin - Mensaje entregado:", data.message_id);
        });

        adminSocket.on("message-read-status", (data: ReadStatus) => {
            console.log("✓✓ Admin - Mensaje leído:", data.message_id);
        });

        // Configurar eventos para el usuario de prueba
        testUserSocket.on("connect", () => {
            console.log("✅ TestUser conectado");
            testUserSocket.emit("join-user", { userId: testUserId, token: testUserToken });
        });

        testUserSocket.on("new-message", (data: MessageData) => {
            console.log("📨 TestUser recibió mensaje:", data.message.content);
            // Marcar mensaje como entregado y leído
            console.log("🔄 TestUser marcando mensaje como entregado y leído...", data.message.id);
            
            // Enviar eventos con el formato correcto
            testUserSocket.emit("message-delivered", {
                message_id: data.message.id,
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                token: testUserToken
            });
            
            testUserSocket.emit("message-read", {
                message_id: data.message.id,
                status: 'read',
                read_at: new Date().toISOString(),
                token: testUserToken
            });
        });

        testUserSocket.on("message-delivery-status", (data: DeliveryStatus) => {
            console.log("✓ TestUser - Mensaje entregado:", data.message_id);
        });

        testUserSocket.on("message-read-status", (data: ReadStatus) => {
            console.log("✓✓ TestUser - Mensaje leído:", data.message_id);
        });

        // Función para enviar mensaje
        function sendMessage(sender: Socket, receiverId: string, content: string) {
            console.log("📤 Enviando mensaje:", content);
            sender.emit("chat-message", {
                data: {
                    receiver_id: receiverId,
                    content: content
                },
                token: sender === adminSocket ? adminToken : testUserToken
            });
        }

        // Enviar mensaje del admin al usuario de prueba
        setTimeout(() => {
            console.log("\n📝 Enviando mensaje del admin al usuario de prueba...");
            sendMessage(adminSocket, testUserId, "¡Hola! Este es un mensaje de prueba por WebSocket");
        }, 2000);

        // Enviar mensaje del usuario de prueba al admin
        setTimeout(() => {
            console.log("\n📝 Enviando mensaje del usuario de prueba al admin...");
            sendMessage(testUserSocket, adminId, "¡Hola admin! Recibí tu mensaje");
        }, 4000);

        // Cerrar la conexión después de 10 segundos
        setTimeout(() => {
            console.log("\n🔌 Cerrando conexiones...");
            adminSocket.disconnect();
            testUserSocket.disconnect();
            process.exit(0);
        }, 10000);

        // Manejar cierre manual
        process.on("SIGINT", () => {
            console.log("\n🔌 Cerrando conexiones...");
            adminSocket.disconnect();
            testUserSocket.disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error("Error en la ejecución:", error);
        process.exit(1);
    }
}

// Ejecutar el script
main(); 