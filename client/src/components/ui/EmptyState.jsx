import React from 'react';
import { cn } from '../../utils/helpers';
import Button from './Button';

/**
 * EmptyState Component
 * Displays when there's no data to show
 * Includes icon, message, description, and optional action button
 */
const EmptyState = ({
  icon = null,
  message = 'No data found',
  description = '',
  actionLabel = '',
  onAction = null,
  className = '',
}) => {
  // Default icon if none provided
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="mb-4">
        {icon && typeof icon === 'function' ? React.createElement(icon, { className: "w-16 h-16 text-gray-300" }) : (icon || defaultIcon)}
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>

      {/* Description */}
      {description && <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

/**
 * Predefined Empty State Variants
 */
export const EmptyStateVariants = {
  NoResults: ({ onReset }) => (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      message="No results found"
      description="Try adjusting your search or filter to find what you're looking for."
      actionLabel={onReset ? 'Clear filters' : ''}
      onAction={onReset}
    />
  ),

  NoData: ({ actionLabel, onAction }) => (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      message="No data available"
      description="Get started by creating your first item."
      actionLabel={actionLabel}
      onAction={onAction}
    />
  ),

  NoEvents: ({ onAction }) => (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      }
      message="No events available"
      description="There are currently no events to display. Check back later or create a new event."
      actionLabel={onAction ? 'Create Event' : ''}
      onAction={onAction}
    />
  ),

  NoBatches: ({ onAction }) => (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      message="No batches yet"
      description="You haven't created any batches. Start by uploading student registrations for an event."
      actionLabel={onAction ? 'Upload Batch' : ''}
      onAction={onAction}
    />
  ),

  NoPayments: () => (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      }
      message="No payment history"
      description="You don't have any payments yet. Payments will appear here once you complete a transaction."
    />
  ),

  Error: ({ message, description, onRetry }) => (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-red-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      message={message || 'Something went wrong'}
      description={description || 'An error occurred while loading the data. Please try again.'}
      actionLabel={onRetry ? 'Try Again' : ''}
      onAction={onRetry}
    />
  ),
};

export default EmptyState;
