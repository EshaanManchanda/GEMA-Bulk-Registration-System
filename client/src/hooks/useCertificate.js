import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api';

/**
 * Certificate Hooks
 * Custom React Query hooks for certificate operations
 */

/**
 * Fetch Certificate by Email
 */
export const useFetchCertificate = () => {
    return useMutation({
        mutationFn: async ({ eventId, email }) => {
            const response = await apiClient.post(`/events/${eventId}/fetch-certificate`, { email });
            return response.data.data;
        },
    });
};
