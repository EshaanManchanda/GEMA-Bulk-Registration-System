import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Authentication Store
 * Manages user authentication state, tokens, and user information
 * Persisted to localStorage
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      userRole: null, // 'school', 'admin', 'super_admin', 'moderator'

      // Actions
      login: (userData, accessToken, refreshToken) => {
        set({
          user: userData,
          token: accessToken,
          refreshToken: refreshToken,
          isAuthenticated: true,
          userRole: userData.role || 'school',
        });

        // Also store in localStorage for axios interceptor
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          userRole: null,
        });

        // Clear localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      },

      setUser: (userData) => {
        set({ user: userData });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        set({
          user: { ...currentUser, ...updates },
        });
      },

      setToken: (accessToken) => {
        set({ token: accessToken });
        localStorage.setItem('access_token', accessToken);
      },

      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
        localStorage.setItem('refresh_token', refreshToken);
      },

      refreshAuth: (accessToken, refreshToken) => {
        set({
          token: accessToken,
          refreshToken: refreshToken || get().refreshToken,
        });

        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      },

      // Getters
      isSchool: () => {
        const role = get().userRole;
        return role === 'school';
      },

      isAdmin: () => {
        const role = get().userRole;
        return role === 'admin' || role === 'super_admin' || role === 'moderator';
      },

      isSuperAdmin: () => {
        return get().userRole === 'super_admin';
      },

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;

        // Super admin has all permissions
        if (user.role === 'super_admin') return true;

        // Check specific permission
        return user.permissions?.includes(permission) || false;
      },

      // Check if user is authenticated and verified
      isVerified: () => {
        const user = get().user;
        return user?.is_verified || user?.email_verified || false;
      },

      // Get user's full name
      getFullName: () => {
        const user = get().user;
        if (!user) return '';

        if (user.name) return user.name;
        if (user.contact_person?.name) return user.contact_person.name;
        return user.email || '';
      },

      // Get user's email
      getEmail: () => {
        const user = get().user;
        if (!user) return '';

        return user.email || user.contact_person?.email || '';
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
      }),
    }
  )
);

export default useAuthStore;
