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
      let url: URL;
      if (username) {
        url = new URL(`${this.baseUrl}/posts/username`);
        url.searchParams.append('username', username);
      } else {
        url = new URL(`${this.baseUrl}/posts`);
        url.searchParams.append('limit', '10');
        if (cursor) {
          url.searchParams.append('cursor', cursor);
        }
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Lo sentimos, estamos teniendo algunos problemas técnicos. Por favor, intenta de nuevo en unos minutos.');
      }

      const data = await response.json();

      // Si el servidor responde con 404 y el mensaje es "PostNotFound", 
      // lo tratamos como un caso válido de "no hay posts"
      if (response.status === 404 && data.message === "PostNotFound") {
        return {
          success: true,
          status: 200,
          message: "No hay publicaciones para mostrar",
          data: {
            posts: [],
            nextCursor: null
          }
        };
      }

      if (!response.ok) {
        throw new Error(data.message || 'No pudimos cargar las publicaciones. Por favor, intenta de nuevo.');
      }

      // Transformar las URLs de las imágenes
      data.data.posts = data.data.posts.map((post: Post) => ({
        ...post,
        media_url: this.getFullMediaUrl(post.media || post.media_url)
      }));

      return data;
    } catch (error) {
      console.error('Error en getPosts:', error);
      if (error instanceof Error) {
        throw new Error('No pudimos cargar las publicaciones. Por favor, intenta de nuevo.');
      }
      throw new Error('Algo salió mal. Por favor, intenta de nuevo más tarde.');
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

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Lo sentimos, estamos teniendo algunos problemas técnicos. Por favor, intenta de nuevo en unos minutos.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No pudimos eliminar la publicación. Por favor, intenta de nuevo.');
      }

      return {
        success: true,
        message: 'Publicación eliminada correctamente'
      };
    } catch (error) {
      console.error('Error en deletePost:', error);
      if (error instanceof Error) {
        throw new Error('No pudimos eliminar la publicación. Por favor, intenta de nuevo.');
      }
      throw new Error('Algo salió mal. Por favor, intenta de nuevo más tarde.');
    }
  }
}

export const postService = new PostService(); 