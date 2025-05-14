import { Socket, Server } from "socket.io";
import { VideoCallService } from "../services/videoCall";

const videoCallService = VideoCallService.getInstance();

export function videoCallEvents(socket: Socket, io: Server) {
    socket.on("register_user", async (data) => {
        const { user_id } = data;

        socket.data.user_id = user_id;
    });

    socket.on("queue_for_call", async () => {
        const user_id = socket.data.user_id;

        const queueResult = await videoCallService.QueueVideoCall(user_id, socket.id);

        socket.emit("queue_result", queueResult);
    });

    socket.on("do_match", async () => {
        const user_id = socket.data.user_id;
        if (!user_id) return;
    });

    socket.on("leave_queue", async () => {
        const user_id = socket.data.user_id;
        if (!user_id) return;
    });

    socket.on("call_connected", async (data) => {

    })

    socket.on("end_call", async () => {
        const user_id = socket.data.user_id;
        if (!user_id) return;
    });

    socket.on("send_offer", async (data) => {

    });

    socket.on("send_answer", async (data) => {

    });

    socket.on("send_ice_candidate", async (data) => {

    });

    socket.on("request_match", async () => {

    });

    socket.on("get_ice_servers", async () => {

    })

    socket.on("disconnect", async () => {

    })
};