export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  author: {
    username: string;
    profile_picture: string | null;
  };
}

interface CommentResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    comment: Comment;
  };
}

interface CommentsResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    comments: Comment[];
  };
}

class CommentService {
  private baseUrl = 'https://332f-37-133-29-123.ngrok-free.app';

  async createComment(token: string, postId: string, content: string): Promise<CommentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          post_id: postId,
          content 
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || 'No pudimos crear el comentario');
        } else {
          throw new Error('Error del servidor al crear el comentario');
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en createComment:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Algo salió mal al crear el comentario');
    }
  }

  async getComments(token: string, postId: string): Promise<CommentsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || 'No pudimos obtener los comentarios');
        } else {
          throw new Error('Error del servidor al obtener los comentarios');
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getComments:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Algo salió mal al obtener los comentarios');
    }
  }

  async deleteComment(token: string, postId: string, commentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || 'No pudimos eliminar el comentario');
        } else {
          throw new Error('Error del servidor al eliminar el comentario');
        }
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Comentario eliminado correctamente'
      };
    } catch (error) {
      console.error('Error en deleteComment:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Algo salió mal al eliminar el comentario');
    }
  }
}

export const commentService = new CommentService(); 