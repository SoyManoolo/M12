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

            const { callId } = data;
            if (!callId) {
                socket.emit("call_connected_result", {
                    success: false,
                    message: "No call ID provided",
                });
                return;
            }

            const connected = await videoCallService.markCallAsConnected(callId);
            if (connected) {
                socket.emit("call_connected_result", {
                    success: true,
                    message: "Call marked as connected",
                });
            } else {
                socket.emit("call_connected_result", {
                    success: false,
                    message: "Failed to mark call as connected",
                });
            }
        } catch (error) {
            console.error("Error connecting call:", error);
            socket.emit("call_connected_result", {
                success: false,
                message: "Error connecting call",
            });
        }
    });

    socket.on("end_call", async (data) => {
        try {
            const user_id = socket.data.user_id;
            if (!user_id) {
                socket.emit("end_call_result", {
                    success: false,
                    message: "User not authenticated",
                });
                return;
            };

            // Obtener el callId del objeto data o buscar la llamada activa
            const callId = data?.callId;
            let callIdToUse = callId;

            // Si no se proporciona callId, buscar la llamada activa
            if (!callIdToUse) {
                const callData = await videoCallService.getUserActiveCall(user_id);
                if (!callData) {
                    socket.emit("end_call_result", {
                        success: false,
                        message: "No active call found",
                    });
                    return;
                }
                callIdToUse = callData.callId;
            }

            const resultEndCall = await videoCallService.endCall(user_id, callIdToUse);

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
            const user_id = socket.data.user_id;
            if (!user_id) {
                socket.emit("send_offer_result", {
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const { offer, to } = data;

            // Buscar el socketId del destinatario usando el servicio
            const recipientData = await videoCallService.getCallRecipient(user_id, to);

            if (!recipientData || !recipientData.socketId) {
                socket.emit("send_offer_result", {
                    success: false,
                    message: "Recipient not found or not connected",
                });
                return;
            }

            // Enviar oferta al destinatario
            io.to(recipientData.socketId).emit("receive_offer", {
                offer,
                from: user_id,
                callId: recipientData.callId
            });

            socket.emit("send_offer_result", {
                success: true,
                message: "Offer sent successfully",
            });
        } catch (error) {
            console.error("Error sending offer:", error);
            socket.emit("send_offer_result", {
                success: false,
                message: "Error sending offer",
            });
        }
    });

    socket.on("send_answer", async (data) => {
        try {
            const user_id = socket.data.user_id;
            if (!user_id) {
                socket.emit("send_answer_result", {
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const { answer, to } = data;

            // Buscar el socketId del destinatario usando el servicio
            const recipientData = await videoCallService.getCallRecipient(user_id, to);

            if (!recipientData || !recipientData.socketId) {
                socket.emit("send_answer_result", {
                    success: false,
                    message: "Recipient not found or not connected",
                });
                return;
            }

            // Enviar respuesta al destinatario
            io.to(recipientData.socketId).emit("receive_answer", {
                answer,
                from: user_id,
                callId: recipientData.callId
            });

            socket.emit("send_answer_result", {
                success: true,
                message: "Answer sent successfully",
            });
        } catch (error) {
            console.error("Error sending answer:", error);
            socket.emit("send_answer_result", {
                success: false,
                message: "Error sending answer",
            });
        }
    });

    socket.on("send_ice_candidate", async (data) => {
        try {
            const user_id = socket.data.user_id;
            if (!user_id) {
                socket.emit("send_ice_candidate_result", {
                    success: false,
                    message: "User not authenticated",
                });
                return;
            }

            const { candidate, to } = data;

            // Buscar el socketId del destinatario usando el servicio
            const recipientData = await videoCallService.getCallRecipient(user_id, to);

            if (!recipientData || !recipientData.socketId) {
                socket.emit("send_ice_candidate_result", {
                    success: false,
                    message: "Recipient not found or not connected",
                });
                return;
            }

            // Enviar candidato ICE al destinatario
            io.to(recipientData.socketId).emit("receive_ice_candidate", {
                candidate,
                from: user_id,
                callId: recipientData.callId
            });

            socket.emit("send_ice_candidate_result", {
                success: true,
                message: "ICE candidate sent successfully",
            });
        } catch (error) {
            console.error("Error sending ICE candidate:", error);
            socket.emit("send_ice_candidate_result", {
                success: false,
                message: "Error sending ICE candidate",
            });
        }
    });

    socket.on("disconnect", async () => {
        try {
            const user_id = socket.data.user_id;
            if (!user_id) return;

            console.log(`User ${user_id} disconnected`);

            // 1. Si el usuario está en cola, sacarlo
            const queueResult = await videoCallService.leaveQueue(user_id);
            if (queueResult) {
                console.log(`User ${user_id} removed from queue due to disconnect`);
            }

            // 2. Si el usuario está en una llamada, terminarla y notificar al otro usuario
            const callData = await videoCallService.getUserActiveCall(user_id);
            if (callData) {
                // Notificar al otro participante
                const otherParticipantId = callData.participants.find(p => p !== user_id);
                if (otherParticipantId) {
                    const otherSocketId = await videoCallService.getUserSocketId(otherParticipantId);
                    if (otherSocketId) {
                        io.to(otherSocketId).emit("partner_disconnected", {
                            callId: callData.callId,
                            reason: "Partner disconnected from server"
                        });
                    }
                }

                // Terminar la llamada en la base de datos
                await videoCallService.endCall(user_id, callData.callId); // Correcto
                console.log(`Call ${callData.callId} ended due to user ${user_id} disconnect`);
            }
        } catch (error) {
            console.error("Error handling disconnect:", error);
            // No podemos emitir al socket porque ya se desconectó
        }
    });
}