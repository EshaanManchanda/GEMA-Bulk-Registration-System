import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ENDPOINTS } from '../api';
import { queryKeys } from '../config/queryClient';

/**
 * Payment Hooks
 * Custom React Query hooks for payment operations
 */

/**
 * Get My Payments List
 */
export const useMyPayments = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.PAYMENTS.MY_PAYMENTS, { params: filters });
      return response.data.data;
    },
  });
};

/**
 * Get Payment Details
 */
export const usePaymentDetails = (paymentId) => {
  return useQuery({
    queryKey: queryKeys.payments.detail(paymentId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.PAYMENTS.PAYMENT_DETAILS(paymentId));
      return response.data.data.payment;
    },
    enabled: !!paymentId,
  });
};

/**
 * Initiate Payment (Online)
 */
export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: async ({ batchReference, paymentMethod }) => {
      const response = await apiClient.post(ENDPOINTS.PAYMENTS.INITIATE_PAYMENT, {
        batch_reference: batchReference,
        payment_method: paymentMethod,
      });
      return response.data;
    },
  });
};

/**
 * Verify Stripe Payment
 */
export const useVerifyStripePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      const response = await apiClient.post(ENDPOINTS.PAYMENTS.VERIFY_STRIPE, paymentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all });
    },
  });
};

/**
 * Submit Offline Payment
 */
export const useOfflinePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      const formData = new FormData();
      formData.append('batch_reference', paymentData.batch_reference);
      formData.append('transaction_id', paymentData.transaction_id);
      formData.append('amount', paymentData.amount);
      formData.append('payment_date', paymentData.payment_date);
      if (paymentData.notes) formData.append('notes', paymentData.notes);
      if (paymentData.receipt) formData.append('receipt', paymentData.receipt);

      const response = await apiClient.post(ENDPOINTS.PAYMENTS.SUBMIT_OFFLINE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all });
    },
  });
};

/**
 * Download Payment Receipt
 */
export const useDownloadReceipt = () => {
  return useMutation({
    mutationFn: async (paymentId) => {
      // Open receipt URL in new tab (redirects to Cloudinary/storage URL)
      window.open(ENDPOINTS.PAYMENTS.DOWNLOAD_RECEIPT(paymentId), '_blank');
      return { success: true };
    },
  });
};
