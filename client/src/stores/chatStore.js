import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const useChatStore = create((set, get) => ({
  // State
  messages: [],
  isOpen: false,
  isLoading: false,
  sessionId: null,
  error: null,

  // Actions
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  openChat: () => set({ isOpen: true }),

  closeChat: () => set({ isOpen: false }),

  initializeSession: () => {
    const existingSessionId = localStorage.getItem('chat_session_id');
    if (existingSessionId) {
      set({ sessionId: existingSessionId });
      get().loadHistory(existingSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_session_id', newSessionId);
      set({ sessionId: newSessionId });
    }
  },

  sendMessage: async (text) => {
    const { sessionId, messages } = get();

    if (!sessionId) {
      get().initializeSession();
    }

    // Add user message
    const userMessage = {
      text,
      sender: 'user',
      timestamp: new Date()
    };

    set({ messages: [...messages, userMessage], isLoading: true, error: null });

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/chatbot/message`,
        {
          message: text,
          sessionId: get().sessionId
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      // Add bot response
      const botMessage = {
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data.data,
        suggestions: response.data.suggestions
      };

      set((state) => ({
        messages: [...state.messages, botMessage],
        isLoading: false
      }));

    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage = {
        text: error.response?.data?.message || 'Sorry, something went wrong. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        suggestions: error.response?.data?.suggestions || ['Try again']
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
        error: error.message
      }));
    }
  },

  loadHistory: async (sessionId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_URL}/chatbot/history/${sessionId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      set({ messages: response.data.messages || [] });
    } catch (error) {
      console.error('Load history error:', error);
      // Don't show error to user for history loading
    }
  },

  clearHistory: () => {
    localStorage.removeItem('chat_session_id');
    set({ messages: [], sessionId: null });
    get().initializeSession();
  },

  addSuggestionMessage: (suggestion) => {
    get().sendMessage(suggestion);
  }
}));

// Initialize session on store creation
if (typeof window !== 'undefined') {
  useChatStore.getState().initializeSession();
}
