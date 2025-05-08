import React from 'react';

interface MessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

const Message: React.FC<MessageProps> = ({ type, message, onClose }) => {
  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-500/10 border-red-500 text-red-500';
      case 'success':
        return 'bg-green-500/10 border-green-500 text-green-500';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500 text-yellow-500';
      case 'info':
        return 'bg-blue-500/10 border-blue-500 text-blue-500';
      default:
        return 'bg-gray-500/10 border-gray-500 text-gray-500';
    }
  };

  return (
    <div className={`mb-4 p-3 border rounded-md text-sm ${getStyles()}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-current hover:opacity-75"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Message; 