import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';

/**
 * Brand Info Hooks
 */

// Fetch brand info (public)
export const useBrandInfo = () => {
  return useQuery({
    queryKey: ['brandInfo'],
    queryFn: async () => {
      const response = await apiClient.get('/brand');
      return response.data.data.brandInfo;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Update brand info (admin)
export const useUpdateBrandInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.put('/admin/brand', data);
      return response.data.data.brandInfo;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['brandInfo'], data);
    },
  });
};
