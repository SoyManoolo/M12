-- Esquema de la base de datos actualizado para FriendsGo

-- Tabla de usuarios
CREATE TABLE users (
    user_id char(36) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(255),
    bio TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,  -- Campo añadido para identificar moderadores
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de publicaciones
CREATE TABLE posts (
    post_id char(36) PRIMARY KEY,
    user_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    media_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de likes en publicaciones
CREATE TABLE post_likes (
    like_id char(36) PRIMARY KEY,
    post_id char(36) REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de comentarios en publicaciones
CREATE TABLE post_comments (
    comment_id char(36) PRIMARY KEY,
    post_id char(36) REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de videollamadas
CREATE TABLE video_calls (
    call_id char(36) PRIMARY KEY,
    user1_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    user2_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    call_duration INTERVAL,
    status VARCHAR(20) DEFAULT 'active',
    match_status BOOLEAN DEFAULT FALSE
);

-- Tabla de solicitudes de amistad
CREATE TABLE friend_requests (
    request_id char(36) PRIMARY KEY,
    sender_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',  -- e.g., 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de amigos
CREATE TABLE friends (
    friendship_id char(36) PRIMARY KEY,
    user1_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    user2_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensajes de chat
CREATE TABLE chat_messages (
    message_id char(36) PRIMARY KEY,
    sender_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de bloqueos de usuarios
CREATE TABLE user_blocks (
    block_id char(36) PRIMARY KEY,
    blocker_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de valoraciones de videollamadas
CREATE TABLE video_call_ratings (
    rating_id char(36) PRIMARY KEY,
    video_call_id char(36) REFERENCES video_calls(call_id) ON DELETE CASCADE,
    rater_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    rated_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reportes
CREATE TABLE reports (
    report_id char(36) PRIMARY KEY,
    reporter_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    reported_user_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    report_type VARCHAR(50),  -- e.g., 'video_call', 'post', 'comment'
    related_id char(36),  -- ID del elemento relacionado (call_id, post_id, etc.)
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de moderación de contenido
CREATE TABLE content_moderation (
    moderation_id char(36) PRIMARY KEY,
    moderator_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    reported_user_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    report_reason TEXT NOT NULL,
    action_taken VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones
CREATE TABLE notifications (
    notification_id char(36) PRIMARY KEY,
    user_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50),  -- e.g., 'friend_request', 'message', 'comment'
    related_id char(36),  -- ID del elemento relacionado
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla opcional para guardar publicaciones
CREATE TABLE saved_posts (
    save_id char(36) PRIMARY KEY,
    user_id char(36) REFERENCES users(user_id) ON DELETE CASCADE,
    post_id char(36) REFERENCES posts(post_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_friends_user1_user2 ON friends(user1_id, user2_id);
CREATE INDEX idx_chat_messages_sender_receiver ON chat_messages(sender_id, receiver_id);
