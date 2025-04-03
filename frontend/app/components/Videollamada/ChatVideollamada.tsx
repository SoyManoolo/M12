import { useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

interface ChatVideollamadaProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
}

export default function ChatVideollamada({ messages = [], onSendMessage }: ChatVideollamadaProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    onSendMessage?.(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="h-full bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col">
      <div className="text-lg font-bold mb-4">
        CHAT DE VIDEOLLAMADA
      </div>
      
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`p-2 rounded-lg ${
              message.sender === 'me' 
                ? 'bg-gray-800 border border-gray-600 ml-auto' 
                : 'bg-gray-800 border border-gray-600'
            } max-w-[80%]`}
          >
            <p className="text-sm">{message.text}</p>
            <span className="text-xs text-gray-400">{message.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Chat input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
        />
        <button 
          onClick={handleSendMessage}
          className="bg-gray-800 border border-gray-700 hover:bg-gray-700 px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
} 