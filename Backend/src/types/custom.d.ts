import { JwtPayload } from "jsonwebtoken";

// =======================================
// === GLOBAL TYPE EXTENSIONS ============
// =======================================

// Añadimos la interfaz JwtPayload para que sea reconocida en el Request de Express
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// =======================================
// === USER MODEL INTERFACES ============
// =======================================

// Definimos la interfaz para los filtrados de usuario
export interface UserFilters {
    user_id?: string;
    username?: string;
    email?: string;
};

// Definimos la interfaz para los datos de actualización de usuario
export interface UpdateUserData {
    username?: string;
    email?: string;
    password?: string;
    bio?: string;
};

// Interfaz para los campos opcionales en la creación del modelo
export interface UserCreationAttributes
    extends Optional<
        UserAttributes,
        | "user_id"
        | "profile_picture"
        | "bio"
        | "email_verified"
        | "is_moderator"
        | "active_video_call"
        | "created_at"
        | "updated_at"
        | "deleted_at"
    > { }

// Interfaz completa para el modelo User
export interface UserAttributes {
    user_id: string;
    name: string;
    surname: string;
    username: string;
    email: string;
    password: string;
    profile_picture: string | null;
    bio: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    active_video_call: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}

// =======================================
// === CHAT MESSAGES INTERFACES =========
// =======================================

// DInterfaz para los atributos necesarios para crear un mensaje
export type CreateMessageAttributes = Pick<
    IChatMessages,
    "sender_id" | "receiver_id" | "content"
>;

// Interfaz para los atributos opcionales en la creación de mensajes
export interface ChatMessagesCreationAttributes
    extends Optional<
        IChatMessages,
        | "chat_id"
        | "is_delivered"
        | "delivered_at"
        | "read_at"
        | "created_at"
        | "updated_at"
        | "sender"
        | "receiver"
    > { }

// Interfaz completa para el modelo ChatMessages
export interface IChatMessages {
    chat_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_delivered: boolean;
    delivered_at: Date | null;
    read_at: Date | null;
    created_at?: Date;
    updated_at?: Date;
    sender?: User;
    receiver?: User;
}

// =======================================
// === VIDEO CALLS INTERFACES ===========
// =======================================

export interface VideoCallCreationAttributes
    extends Optional<
        VideoCallAttributes,
        | "call_id"
        | "started_at"
        | "ended_at"
        | "call_duration"
        | "status"
        | "match_status"
    > { }

// Interfaz para la creación de una videollamada
export interface VideoCallAttributes {
    call_id: string;
    user1_id: string;
    user2_id: string;
    started_at: Date;
    ended_at: Date | null;
    call_duration: number | null;
    status: string;
    match_status: boolean;
}

export { };
