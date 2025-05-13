import { Socket, Server } from "socket.io";
import { VideoCallService } from "../services/videoCall";

const videoCallService = VideoCallService.getInstance();