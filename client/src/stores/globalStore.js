import { create } from 'zustand';

/**
 * Global Store
 * Manages application-wide state like loading, modals, notifications
 */
const useGlobalStore = create((set, get) => ({
  // Loading States
  isLoading: false,
  loadingMessage: '',

  // Modal State
  activeModal: null,
  modalData: null,

  // Sidebar State (for mobile)
  isSidebarOpen: false,

  // Notifications/Toast State (can be managed here or via react-hot-toast)
  notifications: [],

  // Theme (optional - for future dark mode)
  theme: 'light',

  // ===================================
  // LOADING ACTIONS
  // ===================================
  setLoading: (isLoading, message = '') => {
    set({ isLoading, loadingMessage: message });
  },

  startLoading: (message = 'Loading...') => {
    set({ isLoading: true, loadingMessage: message });
  },

  stopLoading: () => {
    set({ isLoading: false, loadingMessage: '' });
  },

  // ===================================
  // MODAL ACTIONS
  // ===================================
  openModal: (modalName, data = null) => {
    set({ activeModal: modalName, modalData: data });
  },

  closeModal: () => {
    set({ activeModal: null, modalData: null });
  },

  setModalData: (data) => {
    set({ modalData: data });
  },

  isModalOpen: (modalName) => {
    return get().activeModal === modalName;
  },

  // ===================================
  // SIDEBAR ACTIONS
  // ===================================
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  openSidebar: () => {
    set({ isSidebarOpen: true });
  },

  closeSidebar: () => {
    set({ isSidebarOpen: false });
  },

  // ===================================
  // NOTIFICATION ACTIONS
  // ===================================
  addNotification: (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info', // 'success', 'error', 'warning', 'info'
      message: '',
      duration: 3000,
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // ===================================
  // THEME ACTIONS
  // ===================================
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    localStorage.setItem('theme', newTheme);
  },

  initTheme: () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    set({ theme: savedTheme });
  },
}));

export default useGlobalStore;
