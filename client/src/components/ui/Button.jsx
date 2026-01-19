import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 * Uses Tailwind classes from global.css
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  isLoading, // Add support for isLoading alias
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  ...props
}) => {
  // Use isLoading if provided, otherwise fallback to loading
  const isButtonLoading = isLoading !== undefined ? isLoading : loading;
  // Variant classes
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
  };

  // Size classes
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled || isButtonLoading}
      onClick={onClick}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isButtonLoading && 'opacity-75 cursor-wait',
        className
      )}
      {...props}
    >
      {isButtonLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>
      )}
    </button>
  );
};

export default Button;
