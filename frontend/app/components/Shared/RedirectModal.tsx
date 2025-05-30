import { useState, useEffect } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

interface RedirectModalProps {
  isOpen: boolean;
  message: string;
  redirectTime?: number;
  onRedirect: () => void;
}

export default function RedirectModal({
  isOpen,
  message,
  redirectTime = 3,
  onRedirect
}: RedirectModalProps) {
  const [countdown, setCountdown] = useState(redirectTime);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onRedirect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-gray-900/95 rounded-xl p-8 max-w-md w-full mx-4 border border-gray-800 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-900/50">
            <FaCheckCircle className="text-green-500 text-4xl" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {message}
            </h3>
            <p className="text-gray-400">
              Serás redirigido al login en <span className="text-white font-bold">{countdown}</span> segundos
            </p>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / redirectTime) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 