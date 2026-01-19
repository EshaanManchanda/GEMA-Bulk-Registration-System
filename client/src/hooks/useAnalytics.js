import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Query Keys
 */
const queryKeys = {
  analytics: {
    all: ['analytics'],
    event: (eventId) => ['analytics', 'event', eventId],
    global: (period) => ['analytics', 'global', period],
  },
};

/**
 * Event Analytics
 * Get analytics data for a specific event
 */
export const useEventAnalytics = (eventId) => {
  return useQuery({
    queryKey: queryKeys.analytics.event(eventId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.EVENT_ANALYTICS(eventId));
      return response.data.data;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Global Analytics
 * Get system-wide analytics data
 */
export const useGlobalAnalytics = (period = '30d') => {
  return useQuery({
    queryKey: queryKeys.analytics.global(period),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.GLOBAL_ANALYTICS, {
        params: { period },
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Export Event Registrations
 * Download event registrations as Excel
 */
export const useExportEventRegistrations = () => {
  return async (eventId) => {
    try {
      const response = await apiClient.get(
        ENDPOINTS.ADMIN.EXPORT_EVENT_REGISTRATIONS(eventId),
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-${eventId}-registrations.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  };
};
