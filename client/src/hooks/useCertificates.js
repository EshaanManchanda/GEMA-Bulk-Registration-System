import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ENDPOINTS } from '../api';

// Query keys
export const certificateQueryKeys = {
  all: ['certificates'],
  batchCertificates: (batchId) => ['certificates', 'batch', batchId],
  myCertificates: (filters) => ['certificates', 'my', filters],
};

/**
 * Test certificate configuration for an event (Admin)
 */
export const useTestCertificateConfig = () => {
  return useMutation({
    mutationFn: async (eventId) => {
      const response = await apiClient.post(ENDPOINTS.CERTIFICATES.TEST_CONFIG(eventId));
      return response.data;
    },
  });
};

/**
 * Generate certificates for entire event (Admin)
 */
export const useGenerateEventCertificates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId) => {
      const response = await apiClient.post(ENDPOINTS.CERTIFICATES.GENERATE_EVENT(eventId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateQueryKeys.all });
    },
  });
};

/**
 * Generate certificates for a batch (Admin)
 */
export const useGenerateBatchCertificates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId) => {
      const response = await apiClient.post(ENDPOINTS.CERTIFICATES.GENERATE_BATCH(batchId));
      return response.data;
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: certificateQueryKeys.batchCertificates(batchId) });
      queryClient.invalidateQueries({ queryKey: certificateQueryKeys.all });
    },
  });
};

/**
 * Get batch certificates (Admin)
 */
export const useBatchCertificates = (batchId) => {
  return useQuery({
    queryKey: certificateQueryKeys.batchCertificates(batchId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.CERTIFICATES.BATCH_CERTIFICATES(batchId));
      return response.data.data;
    },
    enabled: !!batchId,
  });
};

/**
 * Get school's certificates (uses results endpoint filtered by certificates)
 */
export const useMyCertificates = (options = {}) => {
  const { page = 1, limit = 50 } = options;

  return useQuery({
    queryKey: certificateQueryKeys.myCertificates(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('hasResult', 'true'); // Only get registrations that might have certificates

      const response = await apiClient.get(
        `${ENDPOINTS.CERTIFICATES.MY_CERTIFICATES}?${params.toString()}`
      );

      // Filter to only those with certificate_url
      const data = response.data.data;
      const certificatesOnly = {
        ...data,
        registrations: data.registrations?.filter(r => r.certificate_url) || []
      };
      certificatesOnly.stats = {
        ...data.stats,
        totalCertificates: certificatesOnly.registrations.length
      };

      return certificatesOnly;
    },
  });
};

/**
 * Download certificate - opens in new tab
 */
export const useDownloadCertificate = () => {
  return useMutation({
    mutationFn: async (certificateUrl) => {
      window.open(certificateUrl, '_blank');
      return { success: true };
    },
  });
};
