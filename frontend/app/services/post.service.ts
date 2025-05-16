interface Post {
  post_id: string;
  user_id: string;
  description: string;
  media_url: string | null;
  media?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author?: {
    user_id: string;
    username: string;
    profile_picture: string | null;
    name: string;
  };
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
  private apiUrl = '/api';

  private getMediaUrl(mediaUrl: string | null): string | null {
    if (!mediaUrl) return null;
    // Si la URL ya es relativa, la devolvemos tal cual
    if (mediaUrl.startsWith('/')) return mediaUrl;
    // Si es una URL completa del servidor local, extraemos la parte relativa
    if (mediaUrl.startsWith(this.baseUrl)) {
      return mediaUrl.replace(this.baseUrl, '');
    }
    // Si no coincide con ninguno de los casos anteriores, asumimos que es relativa
    return `/${mediaUrl}`;
  }

  async getPosts(token: string, cursor?: string, username?: string): Promise<PostsResponse> {
    try {
      let endpoint = username ? '/posts/username' : '/posts';
      let url = new URL(`${this.baseUrl}${endpoint}`);
      
      if (username) {
        url.searchParams.append('username', username);
      } else {
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

      // Transformar las URLs de las imágenes a relativas
      if (data.data && data.data.posts) {
        data.data.posts = data.data.posts.map((post: Post) => ({
          ...post,
          media_url: this.getMediaUrl(post.media || post.media_url),
          author: post.author ? {
            ...post.author,
            profile_picture: this.getMediaUrl(post.author.profile_picture)
          } : post.author
        }));
      }

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

  async updatePost(token: string, postId: string, description: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No pudimos actualizar la publicación');
      }

      return {
        success: true,
        message: 'Publicación actualizada correctamente',
        data: data.data
      };
    } catch (error) {
      console.error('Error en updatePost:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Algo salió mal al actualizar la publicación');
    }
  }
}

export const postService = new PostService(); 