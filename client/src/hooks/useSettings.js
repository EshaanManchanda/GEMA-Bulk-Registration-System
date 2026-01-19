import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Settings Hooks
 */

// Query keys
export const settingsKeys = {
  all: ['settings'],
  general: ['settings', 'general'],
  admins: ['settings', 'admins'],
};

/**
 * Get Settings
 */
export const useSettings = () => {
  return useQuery({
    queryKey: settingsKeys.general,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.SETTINGS);
      return response.data.data?.settings || response.data.settings;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Update Settings
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.SETTINGS, settingsData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
};

/**
 * Get Admin Users
 */
export const useAdminUsers = () => {
  return useQuery({
    queryKey: settingsKeys.admins,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.ADMIN_USERS);
      return response.data.data?.admins || response.data.admins;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create Admin User
 */
export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await apiClient.post(ENDPOINTS.ADMIN.ADMIN_USERS, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.admins });
    },
  });
};

/**
 * Update Admin User
 */
export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userData }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.UPDATE_ADMIN_USER(userId), userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.admins });
    },
  });
};

/**
 * Delete Admin User
 */
export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const response = await apiClient.delete(ENDPOINTS.ADMIN.DELETE_ADMIN_USER(userId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.admins });
    },
  });
};

// Export query keys
export const exportKeys = {
  backupStatus: ['backup', 'status'],
};

/**
 * Export Schools Data
 */
export const useExportSchools = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/export/schools', {}, {
        responseType: 'blob',
      });
      return response;
    },
  });
};

/**
 * Export Events Data
 */
export const useExportEvents = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/export/events', {}, {
        responseType: 'blob',
      });
      return response;
    },
  });
};

/**
 * Export Registrations Data
 */
export const useExportRegistrations = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/export/registrations', {}, {
        responseType: 'blob',
      });
      return response;
    },
  });
};

/**
 * Export Payments Data
 */
export const useExportPayments = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/export/payments', {}, {
        responseType: 'blob',
      });
      return response;
    },
  });
};

/**
 * Export All Data (ZIP)
 */
export const useExportAllData = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/export/all', {}, {
        responseType: 'blob',
      });
      return response;
    },
  });
};

/**
 * Create Database Backup
 */
export const useCreateBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/backup/create');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exportKeys.backupStatus });
    },
  });
};

/**
 * Get Backup Status
 */
export const useBackupStatus = () => {
  return useQuery({
    queryKey: exportKeys.backupStatus,
    queryFn: async () => {
      const response = await apiClient.get('/admin/backup/status');
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export default {
  useSettings,
  useUpdateSettings,
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useExportSchools,
  useExportEvents,
  useExportRegistrations,
  useExportPayments,
  useExportAllData,
  useCreateBackup,
  useBackupStatus,
};
