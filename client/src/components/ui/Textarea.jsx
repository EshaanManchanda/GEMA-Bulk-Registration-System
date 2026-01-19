import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

/**
 * Textarea Component
 * Reusable textarea with error states, labels, and auto-resize option
 * Supports React Hook Form refs
 */
const Textarea = forwardRef(
  (
    {
      label = '',
      name,
      placeholder = '',
      error = '',
      helperText = '',
      required = false,
      disabled = false,
      rows = 4,
      maxLength = null,
      showCharCount = false,
      autoResize = false,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(0);

    const handleChange = (e) => {
      if (showCharCount) {
        setCharCount(e.target.value.length);
      }

      // Auto-resize functionality
      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }

      // Call the parent's onChange if provided
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className={cn('form-group', containerClassName)}>
        {/* Label */}
        {label && (
          <label htmlFor={name} className="form-label">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea Field */}
        <textarea
          ref={ref}
          id={name}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          onChange={handleChange}
          className={cn(
            'input resize-none',
            error && 'input-error',
            disabled && 'bg-gray-100 cursor-not-allowed',
            autoResize && 'overflow-hidden',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-help` : undefined}
          {...props}
        />

        {/* Character Count */}
        {showCharCount && maxLength && (
          <div className="flex justify-end">
            <p className={cn('text-xs mt-1', charCount > maxLength ? 'text-red-600' : 'text-gray-500')}>
              {charCount} / {maxLength}
            </p>
          </div>
        )}

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

Textarea.displayName = 'Textarea';

export default Textarea;
