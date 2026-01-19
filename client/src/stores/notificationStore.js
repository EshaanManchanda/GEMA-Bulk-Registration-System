import useGlobalStore from './globalStore';

/**
 * Notification Hook
 * Provides convenience methods for showing notifications using the global store
 */
export const useNotificationStore = () => {
    const addNotification = useGlobalStore((state) => state.addNotification);

    const showSuccess = (message, duration = 3000) => {
        addNotification({ type: 'success', message, duration });
    };

    const showError = (message, duration = 4000) => {
        addNotification({ type: 'error', message, duration });
    };

    const showInfo = (message, duration = 3000) => {
        addNotification({ type: 'info', message, duration });
    };

    const showWarning = (message, duration = 3500) => {
        addNotification({ type: 'warning', message, duration });
    };

    return { showSuccess, showError, showInfo, showWarning };
};
