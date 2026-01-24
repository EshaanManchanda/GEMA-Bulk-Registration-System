import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ENDPOINTS } from '../api';
import { queryKeys } from '../config/queryClient';

/**
 * Batch Hooks
 * Custom React Query hooks for batch operations
 */

/**
 * Get School Statistics
 */
export const useSchoolStatistics = () => {
  return useQuery({
    queryKey: queryKeys.batches.statistics,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.BATCHES.MY_STATISTICS);
      const stats = response.data.statistics || response.data;

      // Transform to match frontend expectations
      return {
        total_registrations: stats.total_students || 0,
        pending_payments: stats.by_payment_status?.pending || 0,
        confirmed_batches: stats.by_status?.confirmed || 0,
        total_spent: stats.total_amount_paid || 0,
        currency: 'INR', // Default currency
        ...stats,
      };
    },
  });
};

/**
 * Transform batch data to match frontend expectations
 */
const transformBatch = (batch) => {
  if (!batch) return batch;

  return {
    ...batch,
    // Transform event_id to event with name field
    event: batch.event_id ? {
      ...batch.event_id,
      name: batch.event_id.title,
      slug: batch.event_id.event_slug,
    } : null,
    // Map registration_ids to students array
    students: batch.registration_ids ? batch.registration_ids.map(reg => ({
      registration_id: reg.registration_id,
      name: reg.student_name,
      email: reg.dynamic_data?.email || 'N/A',
      phone: reg.dynamic_data?.phone || 'N/A',
      grade: reg.grade,
      section: reg.section,
      ...reg.dynamic_data
    })) : [],
    // Add num_students alias for student_count
    num_students: batch.student_count || batch.total_students || 0,
  };
};

/**
 * Get My Batches List
 */
export const useMyBatches = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.batches.list(filters),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.BATCHES.MY_BATCHES, { params: filters });
      // Backend returns: { status: 'success', data: { batches, pagination } }
      const data = response.data.data || response.data;

      // Transform batches array
      if (data.batches) {
        data.batches = data.batches.map(transformBatch);
      }

      return data;
    },
  });
};

/**
 * Get Batch Details
 */
export const useBatchDetails = (batchReference) => {
  return useQuery({
    queryKey: queryKeys.batches.detail(batchReference),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.BATCHES.BATCH_DETAILS(batchReference));
      // Backend returns: { status: 'success', data: { batch, payment } }
      const data = response.data.data || response.data;

      return {
        batch: transformBatch(data.batch),
        payment: data.payment || null
      };
    },
    enabled: !!batchReference,
  });
};

/**
 * Validate Batch (CSV validation)
 */
export const useValidateBatch = () => {
  return useMutation({
    mutationFn: async ({ eventSlug, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventSlug', eventSlug);

      const response = await apiClient.post(
        ENDPOINTS.BATCHES.VALIDATE_EXCEL,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      // Backend returns: { status: 'success', data: { ... } }
      return response.data.data || response.data;
    },
  });
};

/**
 * Upload Batch (Submit registration)
 */
export const useUploadBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventSlug, file, validationId }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventSlug', eventSlug);
      if (validationId) {
        formData.append('validationId', validationId);
      }

      const response = await apiClient.post(
        ENDPOINTS.BATCHES.UPLOAD_BATCH,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      // Backend returns: { status: 'success', data: { batch, registrations } }
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.statistics });
    },
  });
};

/**
 * Download Template
 */
export const useDownloadTemplate = () => {
  return useMutation({
    mutationFn: async (eventSlug) => {
      try {
        const response = await apiClient.get(ENDPOINTS.BATCHES.DOWNLOAD_TEMPLATE(eventSlug), {
          responseType: 'blob',
        });

        // Validate response
        if (!response.data || response.data.size === 0) {
          throw new Error('Received empty file from server');
        }

        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `${eventSlug}-template.xlsx`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) filename = match[1];
        }

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url); // Clean up

        return response.data;
      } catch (error) {
        console.error('Template download error:', error);
        // Re-throw with better message
        if (error.response?.data) {
          // Try to extract error message from blob
          const text = await error.response.data.text();
          try {
            const json = JSON.parse(text);
            throw new Error(json.message || 'Failed to download template');
          } catch {
            throw new Error('Failed to download template');
          }
        }
        throw error;
      }
    },
  });
};

/**
 * Download Batch CSV
 */
export const useDownloadBatchCSV = () => {
  return useMutation({
    mutationFn: async (batchReference) => {
      const response = await apiClient.get(
        ENDPOINTS.BATCHES.DOWNLOAD_EXCEL(batchReference),
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${batchReference}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return response.data;
    },
  });
};

/**
 * Delete Batch (School)
 */
export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchReference) => {
      const response = await apiClient.delete(ENDPOINTS.BATCHES.DELETE_BATCH(batchReference));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.statistics });
    },
  });
};

/**
 * Check if batch is editable
 */
export const useBatchEditableStatus = (batchReference) => {
  return useQuery({
    queryKey: [...queryKeys.batches.detail(batchReference), 'editable'],
    queryFn: async () => {
      const response = await apiClient.get(`/batches/${batchReference}/editable`);
      return response.data.data || response.data;
    },
    enabled: !!batchReference,
  });
};

/**
 * Add student to batch
 */
export const useAddStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchReference, studentData }) => {
      const response = await apiClient.post(`/batches/${batchReference}/students`, studentData);
      return response.data.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.detail(variables.batchReference) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.statistics });
    },
  });
};

/**
 * Update student in batch
 */
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchReference, registrationId, studentData }) => {
      const response = await apiClient.put(
        `/batches/${batchReference}/students/${registrationId}`,
        studentData
      );
      return response.data.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.detail(variables.batchReference) });
    },
  });
};

/**
 * Remove student from batch
 */
export const useRemoveStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchReference, registrationId }) => {
      const response = await apiClient.delete(
        `/batches/${batchReference}/students/${registrationId}`
      );
      return response.data.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.detail(variables.batchReference) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.statistics });
    },
  });
};
