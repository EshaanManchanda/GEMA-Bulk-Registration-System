import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Tabs Component
 * Horizontal tab navigation with optional count badges and icons
 */
const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'default',
  className = '',
  ...props
}) => {
  // Variant styles
  const variantClasses = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2',
      active: 'border-primary-600 text-primary-600',
      inactive: 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300',
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'rounded-md',
      active: 'bg-white text-primary-600 shadow-sm',
      inactive: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
    },
    underline: {
      container: '',
      tab: 'border-b-2',
      active: 'border-primary-600 text-primary-600 font-semibold',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700',
    },
  };

  const styles = variantClasses[variant] || variantClasses.default;

  return (
    <div
      className={cn('flex gap-1', styles.container, className)}
      role="tablist"
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              styles.tab,
              isActive ? styles.active : styles.inactive,
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Icon */}
            {tab.icon && (
              <span className="flex-shrink-0 w-5 h-5">{tab.icon}</span>
            )}

            {/* Label */}
            <span>{tab.label}</span>

            {/* Count Badge */}
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={cn(
                  'inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full min-w-[1.5rem]',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-200 text-gray-700'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
