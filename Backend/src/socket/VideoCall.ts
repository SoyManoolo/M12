import { Socket, Server } from "socket.io";
import { VideoCallService } from "../services/videoCall";

const videoCallService = VideoCallService.getInstance();

export function videoCallEvents(socket: Socket, io: Server) {
    socket.on("add_to_queue", async (data) => {
        try {
            // Guardar el user_id en el socket
            const { user_id } = data;
            socket.data.user_id = user_id;

            // Meter el usuario en la cola de espera
            const queueResult = await videoCallService.QueueVideoCall(user_id, socket.id);

            // Emitir el resultado al cliente
            if (queueResult) {
                socket.emit("queue_result", {
                    success: true,
                    message: "User added to queue",
                });
            } else {
                socket.emit("queue_result", {
                    success: false,
                    message: "User already in queue",
                });
            }
        } catch (error) {
            socket.emit("queue_result", {
                success: false,
                message: "Error adding user to queue",
            });
        }
    });

    socket.on("leave_queue", async () => {
        try {
            const user_id = socket.data.user_id;
            if (!user_id) {
                socket.emit("leave_queue_result", {
                    success: false,
                    message: "User not authenticated",
                });
                return;
            };

            const resultLeave = await videoCallService.leaveQueue(user_id);
            if (resultLeave) {
                socket.emit("leave_queue_result", {
                    success: true,
                    message: "User removed from queue",
                });
            } else {
                socket.emit("leave_queue_result", {
                    success: false,
                    message: "User not in queue",
                });
            }
        } catch (error) {
            socket.emit("leave_queue_result", {
                success: false,
                message: "Error removing user from queue",
            });
        }
    });

    socket.on("call_connected", async (data) => {
        try {
            const user_id = socket.data.user_id;
            if (!user_id) {
                socket.emit("call_connected_result", {
                    success: false,
                    message: "User not authenticated",
                });
                return;
            };
        } catch (error) {
            socket.emit("call_connected_result", {
                success: false,
                message: "Error connecting call",
            });
        }
    });

    socket.on("end_call", async () => {
        try {
            const user_id = socket.data.user_id;
            if (!user_id) {
                socket.emit("leave_queue_result", {
                    success: false,
                    message: "User not authenticated",
                });
                return;
            };

            const resultEndCall = await videoCallService.endCall(user_id, socket.id);
            if (resultEndCall) {
                socket.emit("end_call_result", {
                    success: true,
                    message: "Call ended",
                });
            } else {
                socket.emit("end_call_result", {
                    success: false,
                    message: "Error ending call",
                });
            }
        } catch (error) {
            socket.emit("end_call_result", {
                success: false,
                message: "Error ending call",
            });
        }
    });

    socket.on("send_offer", async (data) => {
        try {

        } catch (error) {
            socket.emit("send_offer_result", {
                success: false,
                message: "Error sending offer",
            });
        }
    });

    socket.on("send_answer", async (data) => {
        try {

        } catch (error) {
            socket.emit("send_answer_result", {
                success: false,
                message: "Error sending answer",
            });
        }
    });

    socket.on("send_ice_candidate", async (data) => {
        try {

        } catch (error) {
            socket.emit("send_ice_candidate_result", {
                success: false,
                message: "Error sending ICE candidate",
            });
        }
    });

    socket.on("request_match", async () => {
        try {

        } catch (error) {
            socket.emit("request_match_result", {
                success: false,
                message: "Error requesting match",
            });
        }
    });

    socket.on("get_ice_servers", async () => {
        try {

        } catch (error) {
            socket.emit("get_ice_servers_result", {
                success: false,
                message: "Error getting ICE servers",
            });
        }
    });

    socket.on("disconnect", async () => {
        try {

        } catch (error) {
            socket.emit("disconnect_result", {
                success: false,
                message: "Error disconnecting",
            });
        }
    });
};