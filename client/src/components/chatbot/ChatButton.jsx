import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

export const ChatButton = () => {
  const { isOpen, toggleChat } = useChatStore();

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <MessageCircle className="w-6 h-6" />
      )}
    </button>
  );
};
