import { useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type,
  onClose,
  duration = 3000
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-900 border-green-700' : 'bg-red-900 border-red-700'
      } border`}>
        {type === 'success' ? (
          <FaCheckCircle className="text-green-500 text-xl mr-3" />
        ) : (
          <FaTimesCircle className="text-red-500 text-xl mr-3" />
        )}
        <p className="text-white">{message}</p>
      </div>
    </div>
  );
} 