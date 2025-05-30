-- Esquema de la base de datos actualizado para FriendsGo

-- Tabla de usuarios
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL CHECK (name != ''),
    surname VARCHAR(100) NOT NULL CHECK (surname != ''),
    username VARCHAR(50) UNIQUE NOT NULL CHECK (username != ''),
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password VARCHAR(255) NOT NULL CHECK (password != ''),
    profile_picture VARCHAR(255),
    bio TEXT,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_moderator BOOLEAN DEFAULT FALSE NOT NULL,
    active_video_call BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla de publicaciones
CREATE TABLE posts (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    description TEXT NOT NULL CHECK (description != ''),
    media VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla de likes en publicaciones
CREATE TABLE post_likes (
    like_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

-- Tabla de comentarios en publicaciones
CREATE TABLE post_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (content != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla de videollamadas
CREATE TABLE video_calls (
    call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    user2_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    call_duration INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'missed', 'rejected')),
    match_status BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users_video_call CHECK (user1_id != user2_id)
);

-- Tabla de solicitudes de amistad
CREATE TABLE friend_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_from VARCHAR(20) CHECK (created_from IN ('search', 'video_call', 'suggestion')),
    video_call_id UUID REFERENCES video_calls(call_id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id),
    CONSTRAINT different_users_friend_request CHECK (sender_id != receiver_id)
);

-- Tabla de amigos
CREATE TABLE friends (
    friendship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    user2_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friendship UNIQUE (user1_id, user2_id),
    CONSTRAINT different_users_friendship CHECK (user1_id != user2_id)
);

-- Tabla de mensajes de chat
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (content != ''),
    is_delivered BOOLEAN DEFAULT FALSE NOT NULL,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users_chat CHECK (sender_id != receiver_id)
);

-- Tabla de bloqueos de usuarios
CREATE TABLE user_blocks (
    block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    blocked_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT different_users_block CHECK (blocker_id != blocked_id)
);

-- Tabla de valoraciones de videollamadas
CREATE TABLE video_call_ratings (
    rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_call_id UUID REFERENCES video_calls(call_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    rater_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    rated_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_rating UNIQUE (video_call_id, rater_id),
    CONSTRAINT different_users_rating CHECK (rater_id != rated_id)
);

-- Tabla de reportes
CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    report_type VARCHAR(50) CHECK (report_type IN ('video_call', 'post', 'comment')),
    related_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users_report CHECK (reporter_id != reported_user_id)
);

-- Tabla de moderación de contenido
CREATE TABLE content_moderation (
    moderation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    report_reason TEXT NOT NULL CHECK (report_reason != ''),
    action_taken VARCHAR(255) NOT NULL CHECK (action_taken != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_users_moderation CHECK (moderator_id != reported_user_id)
);

-- Tabla de notificaciones
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    type VARCHAR(50) CHECK (type IN ('friend_request', 'message', 'comment', 'post')),
    related_id UUID NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de JWT tokens
CREATE TABLE jwt (
    token VARCHAR PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabla de logs
CREATE TABLE logs (
    id UUID UNIQUE DEFAULT gen_random_uuid(),
    sequence BIGSERIAL PRIMARY KEY,
    level VARCHAR NOT NULL,
    message TEXT NOT NULL CHECK (message != ''),
    meta JSONB,
    timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_deleted_at ON post_comments(deleted_at);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at);
CREATE INDEX idx_video_calls_user1_id ON video_calls(user1_id);
CREATE INDEX idx_video_calls_user2_id ON video_calls(user2_id);
CREATE INDEX idx_video_calls_status ON video_calls(status);
CREATE INDEX idx_video_calls_created_at ON video_calls(created_at);
CREATE INDEX idx_video_calls_match_status ON video_calls(match_status);
CREATE INDEX idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_video_call_id ON friend_requests(video_call_id);
CREATE INDEX idx_friend_requests_created_at ON friend_requests(created_at);
CREATE INDEX idx_friend_requests_created_from ON friend_requests(created_from);
CREATE INDEX idx_friends_user1_id ON friends(user1_id);
CREATE INDEX idx_friends_user2_id ON friends(user2_id);
CREATE INDEX idx_friends_created_at ON friends(created_at);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_delivered_at ON chat_messages(delivered_at);
CREATE INDEX idx_chat_messages_read_at ON chat_messages(read_at);
CREATE INDEX idx_chat_messages_is_delivered ON chat_messages(is_delivered);
CREATE INDEX idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX idx_user_blocks_created_at ON user_blocks(created_at);
CREATE INDEX idx_video_call_ratings_video_call_id ON video_call_ratings(video_call_id);
CREATE INDEX idx_video_call_ratings_rater_id ON video_call_ratings(rater_id);
CREATE INDEX idx_video_call_ratings_rated_id ON video_call_ratings(rated_id);
CREATE INDEX idx_video_call_ratings_created_at ON video_call_ratings(created_at);
CREATE INDEX idx_video_call_ratings_rating ON video_call_ratings(rating);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_related_id ON reports(related_id);
CREATE INDEX idx_content_moderation_moderator_id ON content_moderation(moderator_id);
CREATE INDEX idx_content_moderation_reported_user_id ON content_moderation(reported_user_id);
CREATE INDEX idx_content_moderation_created_at ON content_moderation(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_related_id ON notifications(related_id);
CREATE INDEX idx_jwt_token ON jwt(token);
CREATE INDEX idx_jwt_created_at ON jwt(created_at);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_meta ON logs USING gin (meta);
