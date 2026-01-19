import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ENDPOINTS } from '../api';

// Query keys
export const resultQueryKeys = {
  all: ['results'],
  eventResults: (eventId) => ['results', 'event', eventId],
  batchResults: (batchRef) => ['results', 'batch', batchRef],
  myResults: (filters) => ['results', 'my', filters],
  publicLookup: (regId) => ['results', 'public', regId],
};

/**
 * Upload results CSV for an event (Admin)
 */
export const useUploadResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, file }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(
        ENDPOINTS.RESULTS.UPLOAD(eventId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: resultQueryKeys.eventResults(eventId) });
      queryClient.invalidateQueries({ queryKey: resultQueryKeys.all });
    },
  });
};

/**
 * Get event results (Admin)
 */
export const useEventResults = (eventId, options = {}) => {
  const { page = 1, limit = 50, hasResult, award, search, sort } = options;

  return useQuery({
    queryKey: [...resultQueryKeys.eventResults(eventId), options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (hasResult !== undefined) params.append('hasResult', hasResult);
      if (award) params.append('award', award);
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);

      const response = await apiClient.get(
        `${ENDPOINTS.RESULTS.EVENT_RESULTS(eventId)}?${params.toString()}`
      );
      return response.data.data;
    },
    enabled: !!eventId,
  });
};

/**
 * Get batch results (Admin)
 */
export const useBatchResults = (batchReference) => {
  return useQuery({
    queryKey: resultQueryKeys.batchResults(batchReference),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.RESULTS.BATCH_RESULTS(batchReference));
      return response.data.data;
    },
    enabled: !!batchReference,
  });
};

/**
 * Update single result (Admin)
 */
export const useUpdateResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, resultData }) => {
      const response = await apiClient.put(
        ENDPOINTS.RESULTS.UPDATE_SINGLE(registrationId),
        resultData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultQueryKeys.all });
    },
  });
};

/**
 * Clear all results for an event (Admin)
 */
export const useClearEventResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId) => {
      const response = await apiClient.delete(ENDPOINTS.RESULTS.CLEAR_EVENT(eventId));
      return response.data;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: resultQueryKeys.eventResults(eventId) });
    },
  });
};

/**
 * Download results template (Admin)
 */
export const useDownloadResultsTemplate = () => {
  return useMutation({
    mutationFn: async (eventId) => {
      window.open(ENDPOINTS.RESULTS.DOWNLOAD_TEMPLATE(eventId), '_blank');
      return { success: true };
    },
  });
};

/**
 * Get school's results
 */
export const useMyResults = (options = {}) => {
  const { page = 1, limit = 50, eventId, hasResult } = options;

  return useQuery({
    queryKey: resultQueryKeys.myResults(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (eventId) params.append('eventId', eventId);
      if (hasResult !== undefined) params.append('hasResult', hasResult);

      const response = await apiClient.get(
        `${ENDPOINTS.RESULTS.MY_RESULTS}?${params.toString()}`
      );
      return response.data.data;
    },
  });
};

/**
 * Get school's results for specific event
 */
export const useMyEventResults = (eventId) => {
  return useQuery({
    queryKey: ['results', 'my', 'event', eventId],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.RESULTS.MY_EVENT_RESULTS(eventId));
      return response.data.data;
    },
    enabled: !!eventId,
  });
};

/**
 * Public result lookup
 */
export const usePublicResultLookup = (registrationId) => {
  return useQuery({
    queryKey: resultQueryKeys.publicLookup(registrationId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.RESULTS.PUBLIC_LOOKUP(registrationId));
      return response.data.data;
    },
    enabled: !!registrationId,
    retry: false,
  });
};
