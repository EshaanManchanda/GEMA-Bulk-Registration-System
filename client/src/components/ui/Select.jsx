import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Select Component
 * Reusable dropdown select with error states and labels
 * Supports React Hook Form refs
 */
const Select = forwardRef(
  (
    {
      label = '',
      name,
      options = [],
      placeholder = 'Select an option',
      error = '',
      helperText = '',
      required = false,
      disabled = false,
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

        {/* Select Field */}
        <select
          ref={ref}
          id={name}
          name={name}
          disabled={disabled}
          className={cn(
            'input',
            error && 'input-error',
            disabled && 'bg-gray-100 cursor-not-allowed',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-help` : undefined}
          {...props}
        >
          {/* Placeholder Option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option, index) => (
            <option
              key={option.key || option.value || index}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

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

Select.displayName = 'Select';

export default Select;
