import toast, { Toaster } from 'react-hot-toast';

/**
 * Toast Notification Component
 * Wrapper for react-hot-toast with pre-styled variants
 */

// Toast configuration
export const toastConfig = {
  duration: 4000,
  position: 'top-right',
  style: {
    borderRadius: '8px',
    fontSize: '14px',
    padding: '12px 16px',
  },
  success: {
    iconTheme: {
      primary: '#22c55e',
      secondary: '#fff',
    },
    style: {
      background: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
    style: {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    },
  },
  loading: {
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#fff',
    },
    style: {
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
    },
  },
};

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {Object} options - Additional toast options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...toastConfig.success,
    duration: options.duration || toastConfig.duration,
    ...options,
  });
};

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {Object} options - Additional toast options
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    ...toastConfig.error,
    duration: options.duration || toastConfig.duration,
    ...options,
  });
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {Object} options - Additional toast options
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
    },
    duration: options.duration || toastConfig.duration,
    ...options,
  });
};

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {Object} options - Additional toast options
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    icon: '⚠️',
    style: {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a',
    },
    duration: options.duration || toastConfig.duration,
    ...options,
  });
};

/**
 * Show loading toast
 * @param {string} message - Loading message
 * @param {Object} options - Additional toast options
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...toastConfig.loading,
    ...options,
  });
};

/**
 * Dismiss toast
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Show promise toast (for async operations)
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for loading, success, and error states
 * @param {Object} options - Additional toast options
 */
export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'An error occurred',
    },
    {
      success: toastConfig.success,
      error: toastConfig.error,
      loading: toastConfig.loading,
      ...options,
    }
  );
};

/**
 * Custom toast with custom component
 * @param {React.Component} component - Custom component to render
 * @param {Object} options - Additional toast options
 */
export const showCustom = (component, options = {}) => {
  return toast.custom(component, {
    duration: options.duration || toastConfig.duration,
    ...options,
  });
};

/**
 * Toast Container Component
 * Place this once in your app (usually in App.jsx or main layout)
 */
export function ToastContainer() {
  return (
    <Toaster
      position={toastConfig.position}
      toastOptions={{
        style: toastConfig.style,
        duration: toastConfig.duration,
      }}
      containerStyle={{
        top: 80, // Adjust based on navbar height
      }}
    />
  );
}

export default {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  dismissToast,
  dismissAllToasts,
  showPromise,
  showCustom,
  ToastContainer,
};
