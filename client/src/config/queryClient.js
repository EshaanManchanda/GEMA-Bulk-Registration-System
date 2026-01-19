import { QueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../api/axios';

/**
 * React Query Configuration
 * Global settings for data fetching, caching, and error handling
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache Configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - Data is considered fresh for this duration
      cacheTime: 10 * 60 * 1000, // 10 minutes - Unused data is kept in cache for this duration

      // Retry Configuration
      retry: 2, // Retry failed requests 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Refetch Configuration
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true, // Refetch on component mount
      refetchOnReconnect: true, // Refetch on network reconnect

      // Error Handling
      onError: (error) => {
        const message = getErrorMessage(error);
        console.error('Query error:', message);
      },

      // Use error boundary for query errors
      useErrorBoundary: false,

      // Keep previous data while fetching new data
      keepPreviousData: true,
    },
    mutations: {
      // Retry Configuration
      retry: false, // Don't retry mutations by default

      // Error Handling
      onError: (error) => {
        const message = getErrorMessage(error);
        console.error('Mutation error:', message);
      },

      // Use error boundary for mutation errors
      useErrorBoundary: false,
    },
  },
});

/**
 * Query Keys Factory
 * Centralized query keys for cache invalidation and management
 */
export const queryKeys = {
  // Auth
  auth: {
    user: ['auth', 'user'],
    schoolProfile: ['auth', 'school', 'profile'],
    adminProfile: ['auth', 'admin', 'profile'],
  },

  // Events
  events: {
    all: ['events'],
    list: (filters) => ['events', 'list', filters],
    detail: (id) => ['events', 'detail', id],
    bySlug: (slug) => ['events', 'slug', slug],
    analytics: (id) => ['events', 'analytics', id],
    registrations: (id) => ['events', 'registrations', id],
  },

  // Batches
  batches: {
    all: ['batches'],
    list: (filters) => ['batches', 'list', filters],
    detail: (ref) => ['batches', 'detail', ref],
    myBatches: ['batches', 'my-batches'],
    statistics: ['batches', 'statistics'],
  },

  // Payments
  payments: {
    all: ['payments'],
    list: (filters) => ['payments', 'list', filters],
    detail: (id) => ['payments', 'detail', id],
    myPayments: ['payments', 'my-payments'],
    pendingOffline: ['payments', 'pending-offline'],
  },

  // Invoices
  invoices: {
    all: ['invoices'],
    detail: (ref) => ['invoices', 'detail', ref],
    myInvoices: ['invoices', 'my-invoices'],
  },

  // Admin - Schools
  schools: {
    all: ['schools'],
    list: (filters) => ['schools', 'list', filters],
    detail: (id) => ['schools', 'detail', id],
    registrations: (id) => ['schools', 'registrations', id],
    payments: (id) => ['schools', 'payments', id],
  },

  // Admin - Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'],
    activities: ['dashboard', 'activities'],
    revenue: ['dashboard', 'revenue'],
  },

  // Form Builder
  formBuilder: {
    schema: (id) => ['form-builder', 'schema', id],
    schemaBySlug: (slug) => ['form-builder', 'schema', 'slug', slug],
    template: ['form-builder', 'template'],
  },
};

/**
 * Helper function to invalidate multiple query keys
 * @param {Array<string[]>} keys - Array of query keys
 */
export const invalidateQueries = async (keys) => {
  await Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
  );
};

/**
 * Helper function to prefetch data
 * @param {string[]} queryKey - Query key
 * @param {Function} queryFn - Query function
 * @param {Object} options - Prefetch options
 */
export const prefetchQuery = async (queryKey, queryFn, options = {}) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 * Helper function to set query data
 * @param {string[]} queryKey - Query key
 * @param {any} data - Data to set
 */
export const setQueryData = (queryKey, data) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Helper function to get query data
 * @param {string[]} queryKey - Query key
 * @returns {any} - Query data
 */
export const getQueryData = (queryKey) => {
  return queryClient.getQueryData(queryKey);
};

/**
 * Helper function to remove query
 * @param {string[]} queryKey - Query key
 */
export const removeQuery = (queryKey) => {
  queryClient.removeQueries({ queryKey });
};

/**
 * Helper function to reset all queries
 */
export const resetQueries = () => {
  queryClient.clear();
};

export default queryClient;
