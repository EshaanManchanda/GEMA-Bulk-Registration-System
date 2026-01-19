import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Spinner Component
 * Loading spinner with multiple sizes
 * Uses .spinner class from global.css
 */
const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  // Color variants
  const colorClasses = {
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-secondary-200 border-t-secondary-600',
    white: 'border-white border-opacity-20 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  return (
    <div
      className={cn(
        'inline-block rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Loading Overlay Component
 * Full-page or local loading overlay with spinner
 */
export const LoadingOverlay = ({
  message = 'Loading...',
  fullPage = false,
  className = '',
}) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            {message && <p className="text-gray-700 font-medium">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {message && <p className="text-gray-700 font-medium">{message}</p>}
      </div>
    </div>
  );
};

export default Spinner;
