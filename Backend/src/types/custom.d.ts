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
    name?: string;
    surname?: string;
    password?: string;
    bio?: string;
};

// Interfaz para los atributos necesarios para crear un usuario
export type CreateUserAttributes = Pick<
    UserAttributes,
    | "name"
    | "surname"
    | "username"
    | "email"
    | "password"
    >

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
    | "sender_id"
    | "receiver_id"
    | "content"
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
    id: string;
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

// Interfaz para los atributos opcionales en la creación de llamadas de video
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

// Interfaz completa para el modelo VideoCalls
export interface VideoCallAttributes {
    call_id: string;
    user1_id: string;
    user2_id: string;
    started_at: Date;
    ended_at: Date | null;
    call_duration: number | null;
    status: string;
    match_status: boolean;
};

// =======================================
// === POST MODEL INTERFACES ============
// =======================================

// Interfaz para los atributos necesarios para crear un post
export type CreatePostAttributes = Pick<
    PostAttributes,
    | "user_id"
    | "description"
    > & {
    media?: string;
};

// Interfaz para los atributos opcionales en la creación de un post
export interface PostCreationAttributes
    extends Optional<
        PostAttributes,
        | "post_id"
        | "media"
        | "created_at"
        | "updated_at"
    > { }

// Interfaz completa para el modelo Post
export interface PostAttributes {
    post_id: string;
    user_id: string;
    description: string;
    media?: string | null;
    created_at?: Date;
    updated_at?: Date | null;
    deleted_at?: Date | null;
};

// =======================================
// === FRIEND REQUEST INTERFACES ========
// =======================================

// Interfaz para los atributos necesarios para crear una solicitud de amistad
export type CreateFriendRequestAttributes = Pick<
    FriendRequestAttributes,
    | "sender_id"
    | "receiver_id"
    | "created_from"
    | "video_call_id"
    >

// Interfaz para los atributos opcionales en la creación de una solicitud de amistad
export interface FriendRequestCreationAttributes
    extends Optional<
        FriendRequestAttributes,
        | "request_id"
        | "status"
        | "created_at"
        | "updated_at"
    > { }

// Interfaz completa para el modelo FriendRequest
export interface FriendRequestAttributes {
    request_id: string;
    sender_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_from?: 'search' | 'video_call' | 'suggestion';
    video_call_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

// =======================================
// === FRIENDS INTERFACES ===============
// =======================================

// Interfaz para los atributos opcionales en la creación de una amistad
export interface FriendsCreationAttributes
    extends Optional<
        FriendsAttributes,
        | "friendship_id"
        | "created_at"
    > { }

// Interfaz completa para el modelo Friends
export interface FriendsAttributes {
    friendship_id: string;
    user1_id: string;
    user2_id: string;
    created_at?: Date;
}

export { };
