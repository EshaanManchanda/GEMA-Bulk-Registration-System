import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Badge Component
 * Status indicator badges with multiple variants
 * Uses .badge-* classes from global.css
 */
const Badge = ({
  children,
  variant = 'info',
  size = 'md',
  icon = null,
  dot = false,
  className = '',
  ...props
}) => {
  // Variant classes
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        'inline-flex items-center gap-1',
        className
      )}
      {...props}
    >
      {/* Dot Indicator */}
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-green-600',
            variant === 'warning' && 'bg-yellow-600',
            variant === 'error' && 'bg-red-600',
            variant === 'info' && 'bg-blue-600'
          )}
        />
      )}

      {/* Icon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Text */}
      {children}
    </span>
  );
};

export default Badge;
