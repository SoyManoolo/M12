interface Post {
  post_id: string;
  user_id: string;
  description: string;
  media_url: string | null;
  media?: string | null;
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
    nextCursor: string | null;
  };
}

class PostService {
  private baseUrl = 'http://localhost:3000';

  private getFullMediaUrl(mediaUrl: string | null): string | null {
    if (!mediaUrl) return null;
    if (mediaUrl.startsWith('http')) return mediaUrl;
    return `${this.baseUrl}${mediaUrl}`;
  }

  async getPosts(token: string, cursor?: string, username?: string): Promise<PostsResponse> {
    try {
      const url = new URL(`${this.baseUrl}/posts`);
      url.searchParams.append('limit', '10');
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }
      if (username) {
        url.searchParams.append('username', username);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      // Si el servidor responde con 404 y el mensaje es "PostNotFound", 
      // lo tratamos como un caso válido de "no hay posts"
      if (response.status === 404 && data.message === "PostNotFound") {
        return {
          success: true,
          status: 200,
          message: "No hay posts disponibles",
          data: {
            posts: [],
            nextCursor: null
          }
        };
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener los posts');
      }

      // Transformar las URLs de las imágenes
      data.data.posts = data.data.posts.map((post: Post) => ({
        ...post,
        media_url: this.getFullMediaUrl(post.media || post.media_url)
      }));

      return data;
    } catch (error) {
      console.error('Error en getPosts:', error);
      throw error;
    }
  }

  async deletePost(token: string, postId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el post');
      }

      return {
        success: true,
        message: 'Post eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en deletePost:', error);
      throw error;
    }
  }
}

export const postService = new PostService(); 