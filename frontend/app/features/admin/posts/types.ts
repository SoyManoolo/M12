export interface AdminPost {
  post_id: string;
  user_id: string;
  description: string;
  media: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  likes_count: string;
  comments_count: string;
  author: {
    user_id: string;
    username: string;
    profile_picture: string | null;
    name: string;
  };
  is_saved?: boolean;
  comments?: Array<{
    comment_id: string;
    user_id: string;
    username: string;
    content: string;
    created_at: string;
  }>;
}

export interface ApiAdminPost {
  post_id: string;
  user_id: string;
  description: string;
  media?: string | null;
  media_url?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  likes_count?: string | number;
  comments_count?: string | number;
  author?: AdminPost['author'];
}
