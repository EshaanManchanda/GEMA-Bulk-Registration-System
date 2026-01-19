import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ENDPOINTS } from '../api';
import useAuthStore from '../stores/authStore';
import { queryKeys } from '../config/queryClient';

/**
 * Auth Hooks
 * Custom React Query hooks for authentication operations
 */

// ===================================
// SCHOOL AUTH HOOKS
// ===================================

/**
 * School Login Mutation
 */
export const useSchoolLogin = () => {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_LOGIN, credentials);
      return response.data;
    },
    onSuccess: (data) => {
      login(
        data.school,
        data.access_token,
        data.refresh_token,
        'school'
      );
    },
  });
};

/**
 * School Registration Mutation
 */
export const useSchoolRegister = () => {
  return useMutation({
    mutationFn: async (registrationData) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_REGISTER, registrationData);
      return response.data;
    },
  });
};

/**
 * School Forgot Password Mutation
 */
export const useSchoolForgotPassword = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_FORGOT_PASSWORD, { email });
      return response.data;
    },
  });
};

/**
 * School Reset Password Mutation
 */
export const useSchoolResetPassword = () => {
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_RESET_PASSWORD, {
        token,
        password,
      });
      return response.data;
    },
  });
};

/**
 * School Verify Email Mutation
 */
export const useSchoolVerifyEmail = () => {
  return useMutation({
    mutationFn: async ({ token }) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_VERIFY_EMAIL, { token });
      return response.data;
    },
  });
};

/**
 * School Send verification OTP Mutation
 */
export const useSendOtp = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_SEND_OTP);
      return response.data;
    },
  });
};

/**
 * School Verify OTP Mutation
 */
export const useVerifyOtp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otp }) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_VERIFY_OTP, { otp });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.schoolProfile });
    },
  });
};

/**
 * School Resend Verification Email Mutation
 */
export const useSchoolResendVerification = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.SCHOOL_RESEND_VERIFICATION, { email });
      return response.data;
    },
  });
};

/**
 * School Change Password Mutation
 */
export const useSchoolChangePassword = () => {
  return useMutation({
    mutationFn: async ({ old_password, new_password }) => {
      const response = await apiClient.put(ENDPOINTS.AUTH.SCHOOL_CHANGE_PASSWORD, {
        old_password,
        new_password,
      });
      return response.data;
    },
  });
};

/**
 * Get School Profile Query
 */
export const useSchoolProfile = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.auth.schoolProfile,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.AUTH.SCHOOL_ME);
      return response.data.data.school;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Update School Profile Mutation
 */
export const useUpdateSchoolProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData) => {
      const response = await apiClient.put(ENDPOINTS.AUTH.SCHOOL_UPDATE_PROFILE, profileData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.schoolProfile });
    },
  });
};

// ===================================
// ADMIN AUTH HOOKS
// ===================================

/**
 * Admin Login Mutation
 */
export const useAdminLogin = () => {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.ADMIN_LOGIN, credentials);
      return response.data;
    },
    onSuccess: (data) => {
      login(
        data.admin,
        data.access_token,
        data.refresh_token,
        data.admin.role // admin, super_admin, or moderator
      );
    },
  });
};

/**
 * Admin Create Mutation (super_admin only)
 */
export const useAdminCreate = () => {
  return useMutation({
    mutationFn: async (adminData) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.ADMIN_CREATE, adminData);
      return response.data;
    },
  });
};

/**
 * Admin Change Password Mutation
 */
export const useAdminChangePassword = () => {
  return useMutation({
    mutationFn: async ({ old_password, new_password }) => {
      const response = await apiClient.put(ENDPOINTS.AUTH.ADMIN_CHANGE_PASSWORD, {
        old_password,
        new_password,
      });
      return response.data;
    },
  });
};

/**
 * Get Admin Profile Query
 */
export const useAdminProfile = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.auth.adminProfile,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.AUTH.ADMIN_ME);
      return response.data.data.admin;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Update Admin Profile Mutation
 */
export const useUpdateAdminProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData) => {
      const response = await apiClient.put(ENDPOINTS.AUTH.ADMIN_PROFILE, profileData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.adminProfile });
    },
  });
};

// ===================================
// COMMON AUTH HOOKS
// ===================================

/**
 * Logout Mutation
 */
export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Optionally call logout endpoint if backend tracks sessions
      // await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
      return true;
    },
    onSuccess: () => {
      logout();
      queryClient.clear(); // Clear all cached queries
    },
  });
};

/**
 * Refresh Token Mutation
 */
export const useRefreshToken = () => {
  const { setToken } = useAuthStore();

  return useMutation({
    mutationFn: async (refreshToken) => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refresh_token: refreshToken,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.access_token, data.refresh_token);
    },
  });
};
