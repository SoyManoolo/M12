import type { AdminPost, ApiAdminPost } from './types';

export function mapAdminPost(post: ApiAdminPost): AdminPost {
  return {
    post_id: post.post_id,
    user_id: post.user_id,
    description: post.description,
    media: post.media || post.media_url || '',
    created_at: post.created_at,
    updated_at: post.updated_at,
    deleted_at: post.deleted_at,
    likes_count: String(post.likes_count ?? 0),
    comments_count: String(post.comments_count ?? 0),
    author: post.author ?? {
      user_id: post.user_id,
      username: 'usuario',
      profile_picture: null,
      name: 'Usuario',
    },
    is_saved: false,
    comments: [],
  };
}
