/**
 * Tipos y definiciones para el sistema de notificaciones
 * 
 * Este archivo contiene las interfaces y tipos necesarios para el manejo
 * de notificaciones en la aplicación.
 * 
 * @module notifications
 */

import type { User } from './user.types';

/**
 * Enumeración de tipos de notificación
 */
export enum NotificationType {
    LIKE = 'like',              // Notificación de "me gusta"
    COMMENT = 'comment',         // Notificación de comentario
    FOLLOW = 'follow',          // Notificación de nuevo seguidor
    MENTION = 'mention',        // Notificación de mención
    SHARE = 'share',            // Notificación de compartir
    VIDEO_CALL = 'video_call',  // Notificación de videollamada
    SYSTEM = 'system'           // Notificación del sistema
}

/**
 * Enumeración de estados de notificación
 */
export enum NotificationStatus {
    UNREAD = 'unread',          // Notificación no leída
    READ = 'read',              // Notificación leída
    ARCHIVED = 'archived'       // Notificación archivada
}

/**
 * Interfaz base para notificaciones
 */
export interface BaseNotification {
    id: string;                 // Identificador único
    type: NotificationType;     // Tipo de notificación
    status: NotificationStatus; // Estado de la notificación
    created_at: string;         // Fecha de creación
    updated_at: string;         // Fecha de última actualización
}

/**
 * Interfaz para notificaciones de "me gusta"
 */
export interface LikeNotification extends BaseNotification {
    type: NotificationType.LIKE;
    post_id: string;            // ID de la publicación
    user_id: string;            // ID del usuario que dio like
    username: string;           // Nombre del usuario que dio like
}

/**
 * Interfaz para notificaciones de comentarios
 */
export interface CommentNotification extends BaseNotification {
    type: NotificationType.COMMENT;
    post_id: string;            // ID de la publicación
    comment_id: string;         // ID del comentario
    user_id: string;            // ID del usuario que comentó
    username: string;           // Nombre del usuario que comentó
    comment_text: string;       // Texto del comentario
}

/**
 * Interfaz para notificaciones de seguidores
 */
export interface FollowNotification extends BaseNotification {
    type: NotificationType.FOLLOW;
    follower_id: string;        // ID del seguidor
    username: string;           // Nombre del seguidor
}

/**
 * Interfaz para notificaciones de menciones
 */
export interface MentionNotification extends BaseNotification {
    type: NotificationType.MENTION;
    post_id: string;            // ID de la publicación
    user_id: string;            // ID del usuario que mencionó
    username: string;           // Nombre del usuario que mencionó
}

/**
 * Interfaz para notificaciones de compartir
 */
export interface ShareNotification extends BaseNotification {
    type: NotificationType.SHARE;
    post_id: string;            // ID de la publicación compartida
    user_id: string;            // ID del usuario que compartió
    username: string;           // Nombre del usuario que compartió
}

/**
 * Interfaz para notificaciones de videollamada
 */
export interface VideoCallNotification extends BaseNotification {
    type: NotificationType.VIDEO_CALL;
    call_id: string;            // ID de la videollamada
    user_id: string;            // ID del usuario que inició la llamada
    username: string;           // Nombre del usuario que inició la llamada
}

/**
 * Interfaz para notificaciones del sistema
 */
export interface SystemNotification extends BaseNotification {
    type: NotificationType.SYSTEM;
    title: string;              // Título de la notificación
    message: string;            // Mensaje de la notificación
}

/**
 * Interfaz principal de notificación
 * Combina todos los tipos de notificación posibles
 */
export interface Notification {
    notification_id: string;    // Identificador único de la notificación
    type: 'friend_request' | 'message' | 'comment' | 'post_like' | 'video_call'; // Tipo de notificación
    user_id: string;            // ID del usuario relacionado
    related_id: string;         // ID del elemento relacionado
    post_id: string | null;     // ID de la publicación (si aplica)
    is_read: boolean;           // Estado de lectura
    severity: 'info' | 'warning' | 'error'; // Nivel de severidad
    created_at: string;         // Fecha de creación
    user?: User;                // Datos del usuario relacionado (opcional)
}

/**
 * Interfaz para la relación de amistad
 */
export interface Friend {
    friendship_id: string;      // Identificador único de la amistad
    user_id: string;            // ID del usuario
    friend_id: string;          // ID del amigo
    status: 'pending' | 'accepted' | 'rejected'; // Estado de la amistad
    created_at: string;         // Fecha de creación
    user?: User;                // Datos del amigo (opcional)
}

/**
 * Interfaz para publicaciones
 */
export interface Post {
    post_id: string;            // Identificador único de la publicación
    user_id: string;            // ID del usuario que publicó
    description: string;        // Descripción del post
    media_url: string | null;   // URL del medio (imagen/video)
    created_at: string;         // Fecha de creación
    updated_at: string;         // Fecha de última actualización
    user?: User;                // Datos del usuario (opcional)
}

/**
 * Interfaz para "me gusta" en publicaciones
 */
export interface PostLike {
    like_id: string;            // Identificador único del like
    post_id: string;            // ID de la publicación
    user_id: string;            // ID del usuario que dio like
    created_at: string;         // Fecha de creación
}

/**
 * Interfaz para comentarios en publicaciones
 */
export interface PostComment {
    comment_id: string;         // Identificador único del comentario
    post_id: string;            // ID de la publicación
    user_id: string;            // ID del usuario que comentó
    content: string;            // Contenido del comentario
    created_at: string;         // Fecha de creación
    updated_at: string;         // Fecha de última actualización
}

/**
 * Interfaz para videollamadas
 */
export interface VideoCall {
    call_id: string;            // Identificador único de la llamada
    user1_id: string;           // ID del primer usuario
    user2_id: string;           // ID del segundo usuario
    started_at: string;         // Fecha de inicio
    ended_at: string | null;    // Fecha de finalización
    call_duration: string | null; // Duración de la llamada
    status: string;             // Estado de la llamada
    match_status: boolean;      // Estado del match
}

/**
 * Interfaz para solicitudes de amistad
 */
export interface FriendRequest {
    request_id: string;         // Identificador único de la solicitud
    sender_id: string;          // ID del remitente
    receiver_id: string;        // ID del receptor
    status: 'pending' | 'accepted' | 'rejected'; // Estado de la solicitud
    created_at: string;         // Fecha de creación
}

/**
 * Interfaz para mensajes de chat
 */
export interface ChatMessage {
    message_id: string;         // Identificador único del mensaje
    sender_id: string;          // ID del remitente
    receiver_id: string;        // ID del receptor
    content: string;            // Contenido del mensaje
    is_read: boolean;           // Estado de lectura
    created_at: string;         // Fecha de creación
}

/**
 * Interfaz para bloqueos de usuario
 */
export interface UserBlock {
    block_id: string;           // Identificador único del bloqueo
    blocker_id: string;         // ID del usuario que bloquea
    blocked_id: string;         // ID del usuario bloqueado
    created_at: string;         // Fecha de creación
}

/**
 * Interfaz para calificaciones de videollamadas
 */
export interface VideoCallRating {
    rating_id: string;          // Identificador único de la calificación
    video_call_id: string;      // ID de la videollamada
    rater_id: string;           // ID del usuario que califica
    rated_id: string;           // ID del usuario calificado
    rating: number;             // Valor de la calificación
    created_at: string;         // Fecha de creación
}

/**
 * Interfaz para reportes
 */
export interface Report {
    report_id: string;          // Identificador único del reporte
    reporter_id: string;        // ID del usuario que reporta
    reported_user_id: string;   // ID del usuario reportado
    report_type: string;        // Tipo de reporte
    related_id: string;         // ID del elemento relacionado
    reason: string;             // Razón del reporte
    created_at: string;         // Fecha de creación
}

/**
 * Interfaz para moderación de contenido
 */
export interface ContentModeration {
    moderation_id: string;      // Identificador único de la moderación
    moderator_id: string;       // ID del moderador
    reported_user_id: string;   // ID del usuario reportado
    report_reason: string;      // Razón del reporte
    action_taken: string;       // Acción tomada
    created_at: string;         // Fecha de creación
}

/**
 * Interfaz para publicaciones guardadas
 */
export interface SavedPost {
    save_id: string;            // Identificador único del guardado
    user_id: string;            // ID del usuario
    post_id: string;            // ID de la publicación
    created_at: string;         // Fecha de creación
} 