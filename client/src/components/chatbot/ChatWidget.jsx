import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, Loader2 } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { ChatMessage } from './ChatMessage';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const ChatWidget = () => {
  const {
    isOpen,
    messages,
    isLoading,
    sessionId,
    closeChat,
    sendMessage,
    clearHistory,
    addSuggestionMessage
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;

    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    addSuggestionMessage(suggestion);
  };

  const handleFeedback = async (messageIndex, rating) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_URL}/chatbot/feedback`,
        {
          sessionId,
          messageIndex,
          rating
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear chat history?')) {
      clearHistory();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Event Assistant</h3>
          <p className="text-xs text-blue-100">Ask about events, certificates, and more</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="p-1.5 hover:bg-blue-700 rounded transition-colors"
            aria-label="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closeChat}
            className="p-1.5 hover:bg-blue-700 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-4">👋 Welcome! How can I help you today?</p>
            <div className="space-y-2">
              <button
                onClick={() => handleSuggestionClick('Show upcoming events')}
                className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                Show upcoming events
              </button>
              <button
                onClick={() => handleSuggestionClick('Generate my certificate')}
                className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                Generate my certificate
              </button>
              <button
                onClick={() => handleSuggestionClick('Check exam dates')}
                className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                Check exam dates
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              messageIndex={index}
              onSuggestionClick={handleSuggestionClick}
              onFeedback={handleFeedback}
            />
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
