import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

// Query keys
export const queryKeys = {
  invoices: {
    all: ['invoices'],
    list: (filters) => ['invoices', 'list', filters],
    detail: (id) => ['invoices', 'detail', id],
    myInvoices: (filters) => ['invoices', 'my', filters],
  },
};

/**
 * Get all invoices for the logged-in school
 */
export const useMyInvoices = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.invoices.myInvoices(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await apiClient.get(
        `${ENDPOINTS.INVOICES.MY_INVOICES}?${params.toString()}`
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get invoice details by ID
 */
export const useInvoiceDetails = (invoiceId) => {
  return useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.INVOICES.DETAILS(invoiceId));
      return response.data.data.invoice;
    },
    enabled: !!invoiceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Download invoice PDF
 */
export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: async (invoiceId) => {
      const response = await apiClient.get(ENDPOINTS.INVOICES.DOWNLOAD(invoiceId), {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `invoice-${invoiceId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
  });
};

/**
 * View invoice PDF in new tab
 */
export const useViewInvoice = () => {
  return useMutation({
    mutationFn: async (invoiceId) => {
      const response = await apiClient.get(ENDPOINTS.INVOICES.DOWNLOAD(invoiceId), {
        responseType: 'blob',
      });

      // Open PDF in new tab
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');

      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      return { success: true };
    },
  });
};

/**
 * Get invoice statistics
 */
export const useInvoiceStatistics = () => {
  return useQuery({
    queryKey: ['invoices', 'statistics'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.INVOICES.STATISTICS);
      return response.data.data.statistics;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Admin hooks (for future use)

/**
 * Get all invoices (admin)
 */
export const useAllInvoices = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.invoices.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.schoolId) params.append('schoolId', filters.schoolId);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await apiClient.get(
        `${ENDPOINTS.INVOICES.ALL}?${params.toString()}`
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Update invoice status (admin)
 */
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, status, notes }) => {
      const response = await apiClient.put(
        ENDPOINTS.INVOICES.UPDATE_STATUS(invoiceId),
        { status, notes }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
};

/**
 * Regenerate invoice (admin)
 */
export const useRegenerateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId) => {
      const response = await apiClient.post(ENDPOINTS.INVOICES.REGENERATE(invoiceId));
      return response.data;
    },
    onSuccess: (data, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
};

export default {
  useMyInvoices,
  useInvoiceDetails,
  useDownloadInvoice,
  useViewInvoice,
  useInvoiceStatistics,
  useAllInvoices,
  useUpdateInvoiceStatus,
  useRegenerateInvoice,
};
