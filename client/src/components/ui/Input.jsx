import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Input Component
 * Reusable text input with error states, labels, and icons
 * Supports React Hook Form refs
 */
const Input = forwardRef(
  (
    {
      label = '',
      type = 'text',
      name,
      placeholder = '',
      error = '',
      helperText = '',
      required = false,
      disabled = false,
      leftIcon = null,
      rightIcon = null,
      onRightIconClick = null,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('form-group', containerClassName)}>
        {/* Label */}
        {label && (
          <label htmlFor={name} className="form-label">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'input',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'input-error',
              disabled && 'bg-gray-100 cursor-not-allowed',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${name}-error` : helperText ? `${name}-help` : undefined}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div
              className={cn(
                'absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400',
                onRightIconClick ? 'cursor-pointer hover:text-gray-600' : 'pointer-events-none'
              )}
              onClick={onRightIconClick}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p id={`${name}-error`} className="form-error" role="alert">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p id={`${name}-help`} className="form-help">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
