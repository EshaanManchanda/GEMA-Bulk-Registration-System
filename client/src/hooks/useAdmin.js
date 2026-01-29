import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

// Query keys
export const queryKeys = {
  admin: {
    dashboard: ['admin', 'dashboard'],
    stats: ['admin', 'dashboard', 'stats'],
    activities: ['admin', 'dashboard', 'activities'],
    revenue: ['admin', 'dashboard', 'revenue'],
  },
  schools: {
    all: ['admin', 'schools'],
    list: (filters) => ['admin', 'schools', 'list', filters],
    detail: (schoolId) => ['admin', 'schools', 'detail', schoolId],
    registrations: (schoolId) => ['admin', 'schools', schoolId, 'registrations'],
    payments: (schoolId) => ['admin', 'schools', schoolId, 'payments'],
  },
  events: {
    all: ['admin', 'events'],
    list: (filters) => ['admin', 'events', 'list', filters],
    detail: (eventId) => ['admin', 'events', 'detail', eventId],
    registrations: (eventId) => ['admin', 'events', eventId, 'registrations'],
    analytics: (eventId) => ['admin', 'events', eventId, 'analytics'],
  },
  payments: {
    all: ['admin', 'payments'],
    list: (filters) => ['admin', 'payments', 'list', filters],
    detail: (paymentId) => ['admin', 'payments', 'detail', paymentId],
    pendingOffline: ['admin', 'payments', 'pending-offline'],
    analytics: ['admin', 'payments', 'analytics'],
  },
};

// ===================================
// DASHBOARD HOOKS
// ===================================

/**
 * Get Dashboard Statistics
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.DASHBOARD_STATS);
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get Dashboard Activities
 */
export const useDashboardActivities = (limit = 10) => {
  return useQuery({
    queryKey: [...queryKeys.admin.activities, limit],
    queryFn: async () => {
      const response = await apiClient.get(`${ENDPOINTS.ADMIN.DASHBOARD_ACTIVITIES}?limit=${limit}`);
      return response.data.data.activities;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get Revenue Data
 */
export const useDashboardRevenue = (period = '30d', currency = 'INR') => {
  return useQuery({
    queryKey: [...queryKeys.admin.revenue, period, currency],
    queryFn: async () => {
      const response = await apiClient.get(`${ENDPOINTS.ADMIN.DASHBOARD_REVENUE}?period=${period}&currency=${currency}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================================
// SCHOOL MANAGEMENT HOOKS
// ===================================

/**
 * Get All Schools
 */
export const useSchools = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.schools.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.approval_status) params.append('approval_status', filters.approval_status);
      if (filters.status) params.append('status', filters.status);
      if (filters.country) params.append('country', filters.country);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await apiClient.get(`${ENDPOINTS.ADMIN.SCHOOLS_LIST}?${params.toString()}`);
      console.log("school data:", response.data.data);
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get School Details
 */
export const useSchoolDetails = (schoolId) => {
  return useQuery({
    queryKey: queryKeys.schools.detail(schoolId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.SCHOOL_DETAILS(schoolId));
      return response.data.data;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Approve School
 */
export const useApproveSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, notes }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.APPROVE_SCHOOL(schoolId), { notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Reject School
 */
export const useRejectSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, reason }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.REJECT_SCHOOL(schoolId), { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Suspend School
 */
export const useSuspendSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, reason }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.SUSPEND_SCHOOL(schoolId), { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
};

/**
 * Activate School
 */
export const useActivateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schoolId) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.ACTIVATE_SCHOOL(schoolId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
};

/**
 * Create School (Admin)
 */
export const useCreateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schoolData) => {
      const response = await apiClient.post(ENDPOINTS.ADMIN.CREATE_SCHOOL, schoolData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Update School (Admin)
 */
export const useUpdateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, schoolData }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.UPDATE_SCHOOL(schoolId), schoolData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

// ===================================
// PAYMENT MANAGEMENT HOOKS
// ===================================

/**
 * Get All Payments
 */
export const useAdminPayments = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
      if (filters.currency) params.append('currency', filters.currency);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`${ENDPOINTS.ADMIN.PAYMENTS_LIST}?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get Pending Offline Payments
 */
export const usePendingOfflinePayments = () => {
  return useQuery({
    queryKey: queryKeys.payments.pendingOffline,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.PENDING_OFFLINE_PAYMENTS);
      return response.data.data.payments;
    },
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Get Payment Details (Admin)
 */
export const useAdminPaymentDetails = (paymentId) => {
  return useQuery({
    queryKey: queryKeys.payments.detail(paymentId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.PAYMENT_DETAILS(paymentId));
      return response.data.data.payment;
    },
    enabled: !!paymentId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get Payment Analytics
 */
export const usePaymentAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.payments.analytics,
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.PAYMENTS_ANALYTICS);
      return response.data.data;
    },
    staleTime: 3 * 60 * 1000,
  });
};

/**
 * Verify Payment
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, notes }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.VERIFY_PAYMENT(paymentId), {
        verification_notes: notes
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.pendingOffline });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Reject Payment
 */
export const useRejectPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.REJECT_PAYMENT(paymentId), {
        rejection_reason: reason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.pendingOffline });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

// ===================================
// EVENT MANAGEMENT HOOKS
// ===================================

/**
 * Transform event data to match frontend expectations
 */
const transformEvent = (event) => {
  if (!event) return event;

  return {
    ...event,
    name: event.title || event.name,
    slug: event.event_slug || event.slug,
    event_date: event.event_start_date || event.event_date,
    capacity: event.max_participants || event.capacity,
  };
};

/**
 * Get All Events (Admin)
 */
export const useAdminEvents = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`${ENDPOINTS.ADMIN.EVENTS_LIST}?${params.toString()}`);
      const data = response.data.data;

      // Transform events array
      if (data.events) {
        data.events = data.events.map(transformEvent);
      }

      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get Event Details (Admin)
 */
export const useAdminEventDetails = (eventId) => {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.EVENT_DETAILS(eventId));
      const { event, statistics } = response.data.data;
      return {
        event: transformEvent(event),
        statistics
      };
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create Event
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData) => {
      const response = await apiClient.post(ENDPOINTS.ADMIN.CREATE_EVENT, eventData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all event queries (list with any filters, detail pages, etc.)
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Update Event
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, eventData }) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.UPDATE_EVENT(eventId), eventData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Delete Event
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId) => {
      const response = await apiClient.delete(ENDPOINTS.ADMIN.DELETE_EVENT(eventId));
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Toggle Event Status
 */
export const useToggleEventStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId) => {
      const response = await apiClient.put(ENDPOINTS.ADMIN.TOGGLE_EVENT_STATUS(eventId));
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

/**
 * Get Event Batches
 */
export const useEventBatches = (eventId, filters = {}) => {
  return useQuery({
    queryKey: ['admin', 'events', eventId, 'batches', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`${ENDPOINTS.ADMIN.EVENT_BATCHES(eventId)}?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get Event Registrations
 */
export const useEventRegistrations = (eventId, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.events.registrations(eventId), filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`${ENDPOINTS.ADMIN.EVENT_REGISTRATIONS(eventId)}?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get School Registrations
 */
export const useSchoolRegistrations = (schoolId, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.schools.registrations(schoolId), filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.event) params.append('event', filters.event);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`${ENDPOINTS.ADMIN.SCHOOL_REGISTRATIONS(schoolId)}?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get School Payments
 */
export const useSchoolPayments = (schoolId, filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.schools.payments(schoolId), filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`${ENDPOINTS.ADMIN.SCHOOL_PAYMENTS(schoolId)}?${params.toString()}`);
      return response.data.data;
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get Batch Details (Admin)
 */
export const useAdminBatchDetails = (batchReference) => {
  return useQuery({
    queryKey: ['admin', 'batches', batchReference],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.BATCH_DETAILS(batchReference));
      return response.data.data.batch;
    },
    enabled: !!batchReference,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Verify Batch Payment (Admin)
 */
export const useVerifyBatchPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchReference, notes }) => {
      const response = await apiClient.post(ENDPOINTS.ADMIN.VERIFY_BATCH_PAYMENT(batchReference), { notes });
      return response.data;
    },
    onSuccess: (_, { batchReference }) => {
      queryClient.invalidateQueries(['admin', 'batches', batchReference]);
      queryClient.invalidateQueries(['admin', 'events']);
    },
  });
};

/**
 * Reject Batch Payment (Admin)
 */
export const useRejectBatchPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchReference, reason }) => {
      const response = await apiClient.post(ENDPOINTS.ADMIN.REJECT_BATCH_PAYMENT(batchReference), { reason });
      return response.data;
    },
    onSuccess: (_, { batchReference }) => {
      queryClient.invalidateQueries(['admin', 'batches', batchReference]);
      queryClient.invalidateQueries(['admin', 'events']);
    },
  });
};

/**
 * Download Batch Data (CSV)
 */
export const useDownloadBatchData = () => {
  return useMutation({
    mutationFn: async (batchReference) => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.DOWNLOAD_BATCH_DATA(batchReference), {
        responseType: 'blob', // Important for file download
      });
      return response.data;
    },
  });
};

/**
 * Get Registration Details (Admin)
 */
export const useAdminRegistrationDetails = (registrationId) => {
  return useQuery({
    queryKey: ['admin', 'registrations', 'detail', registrationId],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ADMIN.REGISTRATION_DETAILS(registrationId));
      return response.data.data.registration;
    },
    enabled: !!registrationId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Delete Batch (Admin)
 */
export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchReference) => {
      const response = await apiClient.delete(ENDPOINTS.ADMIN.BATCH_DETAILS(batchReference));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
};

export default {
  useDashboardStats,
  useDashboardActivities,
  useDashboardRevenue,
  useAdminPayments,
  usePendingOfflinePayments,
  useAdminPaymentDetails,
  usePaymentAnalytics,
  useVerifyPayment,
  useRejectPayment,
  useSchoolRegistrations,
  useSchoolPayments,
  useApproveSchool,
  useRejectSchool,
  useSuspendSchool,
  useActivateSchool,
  useUpdateSchool,
  useToggleEventStatus,
  useDeleteEvent,
  useEventRegistrations,
  useEventBatches,
  useAdminBatchDetails,
  useVerifyBatchPayment,
  useRejectBatchPayment,
  useDownloadBatchData,
  useAdminRegistrationDetails,
  useDeleteBatch,
};
