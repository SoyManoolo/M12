import { useState, useCallback } from 'react';

type MessageType = 'error' | 'success' | 'warning' | 'info';

interface Message {
  type: MessageType;
  text: string;
}

export const useMessage = () => {
  const [message, setMessage] = useState<Message | null>(null);

  const showMessage = useCallback((type: MessageType, text: string) => {
    setMessage({ type, text });
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    showMessage,
    clearMessage
  };
}; 