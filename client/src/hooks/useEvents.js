import { useQuery } from '@tanstack/react-query';
import { apiClient, ENDPOINTS } from '../api';
import { queryKeys } from '../config/queryClient';

/**
 * Event Hooks
 * Custom React Query hooks for event operations
 */

/**
 * Transform event data from API format to frontend format
 */
const transformEvent = (event) => ({
  ...event,
  name: event.title,
  slug: event.event_slug,
  event_date: event.event_start_date,
  capacity: event.max_participants,
  // Use banner_image_url consistently (no transformation)
});

/**
 * Get All Events List
 */
export const useEvents = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.EVENTS.LIST, { params: filters });
      const data = response.data.data;
      return {
        ...data,
        events: data.events.map(transformEvent),
      };
    },
  });
};

/**
 * Get Event Details by ID
 */
export const useEventDetails = (eventId) => {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.EVENTS.DETAIL(eventId));
      return transformEvent(response.data.data.event);
    },
    enabled: !!eventId,
  });
};

/**
 * Get Event by Slug
 */
export const useEventBySlug = (slug) => {
  return useQuery({
    queryKey: queryKeys.events.bySlug(slug),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.EVENTS.BY_SLUG(slug));
      return transformEvent(response.data.data.event);
    },
    enabled: !!slug,
  });
};
