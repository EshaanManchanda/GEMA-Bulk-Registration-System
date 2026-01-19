import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Media Library Hooks
 * Custom React Query hooks for media library operations
 */

// Query keys
export const queryKeys = {
  media: {
    all: ['admin', 'media'],
    list: (filters) => ['admin', 'media', 'list', filters],
    detail: (mediaId) => ['admin', 'media', 'detail', mediaId],
  },
};

// ===================================
// MEDIA QUERY HOOKS
// ===================================

/**
 * Get all media with filters
 */
export const useMediaList = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.media.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.file_type) params.append('file_type', filters.file_type);
      if (filters.search) params.append('search', filters.search);
      if (filters.tags) params.append('tags', filters.tags);
      if (filters.sort) params.append('sort', filters.sort);

      const response = await apiClient.get(
        `${ENDPOINTS.ADMIN.MEDIA_LIST}?${params.toString()}`
      );
      console.log("media:", response)
      return response.data.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    keepPreviousData: true,
  });
};

/**
 * Get media details by ID
 */
export const useMediaDetails = (mediaId) => {
  return useQuery({
    queryKey: queryKeys.media.detail(mediaId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.MEDIA_DETAILS(mediaId));
      return response.data.data.media;
    },
    enabled: !!mediaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// MEDIA MUTATION HOOKS
// ===================================

/**
 * Upload media files (up to 10 at once)
 */
export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, folder, tags }) => {
      const formData = new FormData();

      // Append each file
      files.forEach(file => {
        formData.append('files', file);
      });

      // Append metadata
      if (folder) formData.append('folder', folder);
      if (tags) formData.append('tags', tags);

      const response = await apiClient.post(
        ENDPOINTS.ADMIN.MEDIA_UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
  });
};

/**
 * Update media metadata
 */
export const useUpdateMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, data }) => {
      const response = await apiClient.put(
        ENDPOINTS.ADMIN.MEDIA_UPDATE(mediaId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.media.detail(variables.mediaId)
      });
    },
  });
};

/**
 * Delete media
 */
export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, force = false }) => {
      const url = force
        ? `${ENDPOINTS.ADMIN.MEDIA_DELETE(mediaId)}?force=true`
        : ENDPOINTS.ADMIN.MEDIA_DELETE(mediaId);

      const response = await apiClient.delete(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
  });
};

/**
 * Bulk delete media
 */
export const useBulkDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaIds, force = false }) => {
      const response = await apiClient.post(
        ENDPOINTS.ADMIN.MEDIA_BULK_DELETE,
        { mediaIds, force }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
  });
};
