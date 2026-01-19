import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Checkbox Component
 * Reusable checkbox with label and error states
 * Supports React Hook Form refs
 */
const Checkbox = forwardRef(
  (
    {
      label = '',
      name,
      error = '',
      helperText = '',
      disabled = false,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('form-group', containerClassName)}>
        <div className="flex items-start">
          {/* Checkbox Input */}
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={name}
              name={name}
              type="checkbox"
              disabled={disabled}
              className={cn(
                'w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2',
                error && 'border-red-500',
                disabled && 'opacity-50 cursor-not-allowed',
                className
              )}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${name}-error` : helperText ? `${name}-help` : undefined}
              {...props}
            />
          </div>

          {/* Label */}
          {label && (
            <div className="ml-3 text-sm">
              <label
                htmlFor={name}
                className={cn(
                  'font-medium text-gray-700',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>

              {/* Helper Text */}
              {helperText && (
                <p id={`${name}-help`} className="text-gray-500 mt-1">
                  {helperText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p id={`${name}-error`} className="form-error ml-7" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
