import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');

        // Determine user type from auth storage
        const authStorage = localStorage.getItem('auth-storage');
        let userType = 'school'; // default
        try {
          const authData = authStorage ? JSON.parse(authStorage) : null;
          const userRole = authData?.state?.userRole;
          if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator') {
            userType = 'admin';
          }
        } catch (e) {
          // Fallback to school
        }

        if (refreshToken) {
          const endpoint = userType === 'admin'
            ? `${API_URL}/auth/admin/refresh-token`
            : `${API_URL}/auth/school/refresh-token`;

          const response = await axios.post(endpoint, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data.data.tokens || response.data.data;

          // Update tokens in localStorage
          localStorage.setItem('access_token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          // Update Authorization header
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          // Retry original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        const authStorage = localStorage.getItem('auth-storage');
        localStorage.removeItem('auth-storage');

        // Determine redirect based on user type
        let redirectPath = '/';
        try {
          const authData = authStorage ? JSON.parse(authStorage) : null;
          const userRole = authData?.state?.userRole;
          if (userRole === 'school') {
            redirectPath = '/school/login';
          } else if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator') {
            redirectPath = '/admin/login';
          }
        } catch (e) {
          // Fallback to home
        }

        window.location.href = redirectPath;
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Helper function to extract error message
export const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.message || error.response.data?.error || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'No response from server. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

// Helper function to check if error is authentication error
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

// Helper function to check if error is validation error
export const isValidationError = (error) => {
  return error.response?.status === 400 && error.response?.data?.errors;
};

export default apiClient;
