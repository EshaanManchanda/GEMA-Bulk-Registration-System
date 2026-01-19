import React from 'react';
import { Controller } from 'react-hook-form';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Checkbox from '../ui/Checkbox';
import FileUpload from '../ui/FileUpload';

/**
 * FormField Component
 * Integrates React Hook Form with UI components
 * Handles registration, validation, and error display
 *
 * Can be used in two modes:
 * 1. With `name` and `control` props - uses react-hook-form Controller
 * 2. With `children` prop - acts as a simple label wrapper
 */
const FormField = ({
  name,
  control,
  type = 'text',
  label = '',
  placeholder = '',
  helperText = '',
  error = '',
  required = false,
  disabled = false,
  options = [],
  rules = {},
  children,
  className = '',
  ...props
}) => {
  // If children provided, render as simple wrapper (no Controller)
  if (children) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {children}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Otherwise use Controller for react-hook-form integration
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error: fieldError } }) => {
        // Render different components based on type
        switch (type) {
          case 'text':
          case 'email':
          case 'password':
          case 'number':
          case 'date':
          case 'tel':
          case 'url':
            return (
              <Input
                {...field}
                type={type}
                label={label}
                placeholder={placeholder}
                helperText={helperText}
                error={fieldError?.message}
                required={required}
                disabled={disabled}
                {...props}
              />
            );

          case 'select':
            return (
              <Select
                {...field}
                label={label}
                options={options}
                placeholder={placeholder}
                helperText={helperText}
                error={fieldError?.message}
                required={required}
                disabled={disabled}
                {...props}
              />
            );

          case 'textarea':
            return (
              <Textarea
                {...field}
                label={label}
                placeholder={placeholder}
                helperText={helperText}
                error={fieldError?.message}
                required={required}
                disabled={disabled}
                {...props}
              />
            );

          case 'checkbox':
            return (
              <Checkbox
                {...field}
                label={label}
                helperText={helperText}
                error={fieldError?.message}
                disabled={disabled}
                checked={field.value}
                {...props}
              />
            );

          case 'file':
            return (
              <FileUpload
                label={label}
                helperText={helperText}
                error={fieldError?.message}
                disabled={disabled}
                onFileSelect={(file) => field.onChange(file)}
                {...props}
              />
            );

          default:
            return (
              <Input
                {...field}
                type={type}
                label={label}
                placeholder={placeholder}
                helperText={helperText}
                error={fieldError?.message}
                required={required}
                disabled={disabled}
                {...props}
              />
            );
        }
      }}
    />
  );
};

export default FormField;
