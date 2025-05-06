interface Post {
  post_id: string;
  user_id: string;
  description: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface PostsResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    posts: Post[];
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

class PostService {
  private baseUrl = 'http://localhost:3000';

  async getPosts(token: string): Promise<PostsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener los posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getPosts:', error);
      throw error;
    }
  }
}

export const postService = new PostService(); 