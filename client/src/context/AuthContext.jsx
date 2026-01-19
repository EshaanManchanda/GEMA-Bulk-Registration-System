import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import useAuthStore from '../stores/authStore';
import { showError, showSuccess } from '../components/common/Toast';

/**
 * Auth Context
 * Provides authentication functionality throughout the app
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout, setUser, isSchool, isAdmin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount and refresh user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');

      // If no token but store thinks authenticated, clear state
      if (!token && isAuthenticated) {
        logout();
        setIsLoading(false);
        return;
      }

      // If token exists and authenticated, verify it
      if (token && isAuthenticated) {
        try {
          // Determine which endpoint to use based on user role
          const endpoint = isSchool() ? ENDPOINTS.AUTH.SCHOOL_ME : ENDPOINTS.AUTH.ADMIN_ME;

          // Fetch current user data
          const response = await apiClient.get(endpoint);
          const userData = isSchool() ? response.data.data.school : response.data.data.admin;
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // If token is invalid, logout
          if (error.response?.status === 401) {
            logout();
          }
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, isSchool, setUser, logout]);

  /**
   * School Login
   */
  const loginSchool = async (credentials) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_LOGIN, credentials);
      const { school, tokens } = response.data.data;

      login(school, tokens.access_token, tokens.refresh_token);
      showSuccess('Login successful!');

      // Navigate to school dashboard
      navigate('/school/dashboard');

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      showError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Admin Login
   */
  const loginAdmin = async (credentials) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.ADMIN_LOGIN, credentials);
      const { admin, tokens } = response.data.data;

      login(admin, tokens.access_token, tokens.refresh_token);
      showSuccess('Login successful!');

      // Navigate to admin dashboard
      navigate('/admin/dashboard');

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      showError(message);
      return { success: false, error: message };
    }
  };

  /**
   * School Registration
   */
  const registerSchool = async (registrationData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_REGISTER, registrationData);
      showSuccess('Registration successful! Please check your email to verify your account.');

      // Navigate to login
      navigate('/school/login');

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      showError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    try {
      // Call logout endpoint for admin (optional)
      if (isAdmin()) {
        await apiClient.post(ENDPOINTS.AUTH.ADMIN_LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      showSuccess('Logged out successfully');
      navigate('/');
    }
  };

  /**
   * Verify Email
   */
  const verifyEmail = async (token) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_VERIFY_EMAIL, { token });
      showSuccess('Email verified successfully! You can now login.');
      navigate('/school/login');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      showError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Forgot Password
   */
  const forgotPassword = async (email, userType = 'school') => {
    try {
      const endpoint = userType === 'school'
        ? ENDPOINTS.AUTH.SCHOOL_FORGOT_PASSWORD
        : ENDPOINTS.AUTH.ADMIN_FORGOT_PASSWORD;

      await apiClient.post(endpoint, { email });
      showSuccess('Password reset link sent to your email!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset link';
      showError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Reset Password
   */
  const resetPassword = async (token, password, userType = 'school') => {
    try {
      const endpoint = userType === 'school'
        ? ENDPOINTS.AUTH.SCHOOL_RESET_PASSWORD
        : ENDPOINTS.AUTH.ADMIN_RESET_PASSWORD;

      await apiClient.post(endpoint, { token, password });
      showSuccess('Password reset successful! You can now login.');
      navigate(userType === 'school' ? '/school/login' : '/admin/login');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      showError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Change Password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const endpoint = isSchool()
        ? ENDPOINTS.AUTH.SCHOOL_CHANGE_PASSWORD
        : ENDPOINTS.AUTH.ADMIN_CHANGE_PASSWORD;

      await apiClient.put(endpoint, { currentPassword, newPassword });
      showSuccess('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      showError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Update Profile
   */
  const updateProfile = async (profileData) => {
    try {
      const endpoint = isSchool()
        ? ENDPOINTS.AUTH.SCHOOL_UPDATE_PROFILE
        : ENDPOINTS.AUTH.ADMIN_UPDATE_PROFILE;

      const response = await apiClient.put(endpoint, profileData);
      setUser(response.data.data);
      showSuccess('Profile updated successfully!');
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      showError(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isSchool: isSchool(),
    isAdmin: isAdmin(),
    loginSchool,
    loginAdmin,
    registerSchool,
    logout: handleLogout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use Auth Context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
