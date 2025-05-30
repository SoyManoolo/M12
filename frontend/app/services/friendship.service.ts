import { environment } from '~/config/environment';

interface FriendshipStatus {
  status: 'none' | 'pending' | 'friends';
  request_id?: string;
  is_sender?: boolean;
}

interface FriendRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  sender?: {
    user_id: string;
    username: string;
    name: string;
    profile_picture: string | null;
  };
  receiver?: {
    user_id: string;
    username: string;
    name: string;
    profile_picture: string | null;
  };
}

interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    name: string;
    surname: string;
    email: string;
    profile_picture: string | null;
    bio: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    created_at: string;
    updated_at: string;
  };
}

class FriendshipService {
  private baseUrl = environment.apiUrl;

  async sendFriendRequest(token: string, receiver_id: string): Promise<{ success: boolean; message: string; data?: FriendRequest }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiver_id })
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      console.error('Error al enviar solicitud de amistad:', error);
      return {
        success: false,
        message: 'Error al enviar solicitud de amistad'
      };
    }
  }

  async acceptFriendRequest(token: string, request_id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/accept/${request_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message
      };
    } catch (error) {
      console.error('Error al aceptar solicitud de amistad:', error);
      return {
        success: false,
        message: 'Error al aceptar solicitud de amistad'
      };
    }
  }

  async rejectFriendRequest(token: string, request_id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/reject/${request_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message
      };
    } catch (error) {
      console.error('Error al rechazar solicitud de amistad:', error);
      return {
        success: false,
        message: 'Error al rechazar solicitud de amistad'
      };
    }
  }

  async cancelFriendRequest(token: string, request_id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/request/${request_id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message
      };
    } catch (error) {
      console.error('Error al cancelar solicitud de amistad:', error);
      return {
        success: false,
        message: 'Error al cancelar solicitud de amistad'
      };
    }
  }

  async getPendingFriendRequests(token: string): Promise<{ success: boolean; message: string; data?: FriendRequest[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      return {
        success: false,
        message: 'Error al obtener solicitudes pendientes'
      };
    }
  }

  async getSentFriendRequests(token: string): Promise<{ success: boolean; message: string; data?: FriendRequest[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/sent`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      console.error('Error al obtener solicitudes enviadas:', error);
      return {
        success: false,
        message: 'Error al obtener solicitudes enviadas'
      };
    }
  }

  async getUserFriends(token: string): Promise<{ success: boolean; message: string; data?: Friend[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      console.error('Error al obtener lista de amigos:', error);
      return {
        success: false,
        message: 'Error al obtener lista de amigos'
      };
    }
  }

  async getFriendshipStatus(token: string, other_user_id: string): Promise<{ success: boolean; message: string; data?: FriendshipStatus }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/status/${other_user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      console.error('Error al obtener estado de amistad:', error);
      return {
        success: false,
        message: 'Error al obtener estado de amistad'
      };
    }
  }

  async removeFriendship(token: string, friend_id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/friendship/remove/${friend_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message
      };
    } catch (error) {
      console.error('Error al eliminar amistad:', error);
      return {
        success: false,
        message: 'Error al eliminar amistad'
      };
    }
  }
}

export const friendshipService = new FriendshipService(); 