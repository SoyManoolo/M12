/**
 * Página de Chat Individual
 * 
 * Esta página muestra el chat con un usuario específico.
 * Incluye:
 * - Navbar para navegación
 * - Área de chat con mensajes
 * - Información del usuario con quien se chatea
 * 
 * @module Chat
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from '@remix-run/react';
import Navbar from '~/components/Inicio/Navbar';
import ChatUserInfo from '~/components/Chats/ChatUserInfo';
import { FaPaperPlane } from 'react-icons/fa';
import { redirect } from "@remix-run/node";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_own: boolean;
}

interface User {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  bio: string | null;
  is_online: boolean;
}

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return redirect("/login");
  return null;
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState<User | null>(null);

  // Mock de datos del usuario con quien se chatea
  const mockChatUser: User = {
    user_id: '1',
    username: 'usuario1',
    first_name: 'Usuario',
    last_name: 'Uno',
    profile_picture_url: 'https://i.pravatar.cc/150?img=1',
    bio: '¡Hola! Me encanta compartir momentos especiales',
    is_online: true
  };

  // Mock de mensajes
  const mockMessages: Message[] = [
    {
      id: '1',
      content: '¡Hola! ¿Cómo estás?',
      sender_id: '1',
      receiver_id: '2',
      created_at: new Date().toISOString(),
      is_own: false
    },
    {
      id: '2',
      content: '¡Hola! Todo bien, ¿y tú?',
      sender_id: '2',
      receiver_id: '1',
      created_at: new Date().toISOString(),
      is_own: true
    }
  ];

  useEffect(() => {
    // Aquí iría la lógica para cargar los datos del usuario y los mensajes
    setChatUser(mockChatUser);
    setMessages(mockMessages);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender_id: '2', // ID del usuario actual
      receiver_id: chatUser?.user_id || '',
      created_at: new Date().toISOString(),
      is_own: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  if (!chatUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Cargando chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        {/* Área de chat */}
        <div className="flex flex-col h-screen">
          {/* Encabezado del chat */}
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">{chatUser.first_name} {chatUser.last_name}</h1>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.is_own
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input de mensaje */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
            <div className="flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-900 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="ml-4 p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPaperPlane className="text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Información del usuario */}
      <ChatUserInfo user={chatUser} />
    </div>
  );
} 