import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Badge, Button } from '../../ui';

/**
 * Form Field Editor
 * UI for configuring individual field properties
 */
const FormFieldEditor = ({ fieldIndex, onRemove, isExpanded, onToggle }) => {
  const { register, watch, setValue } = useFormContext();
  const fieldType = watch(`form_schema.${fieldIndex}.field_type`);
  const fieldLabel = watch(`form_schema.${fieldIndex}.field_label`);
  const isRequired = watch(`form_schema.${fieldIndex}.is_required`);

  // Auto-generate field_id from label
  useEffect(() => {
    if (fieldLabel) {
      const fieldId = fieldLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setValue(`form_schema.${fieldIndex}.field_id`, fieldId);
    }
  }, [fieldLabel, fieldIndex, setValue]);

  const FIELD_TYPES = [
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'select', label: 'Select', icon: '📋' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'file', label: 'File', icon: '📎' },
    { value: 'url', label: 'URL', icon: '🔗' },
  ];

  const getFieldTypeIcon = (type) => {
    return FIELD_TYPES.find((ft) => ft.value === type)?.icon || '📝';
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Field Header (Collapsed View) */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="cursor-move text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
            </svg>
          </div>
          <span className="text-xl">{getFieldTypeIcon(fieldType)}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">
                {fieldLabel || `Field ${fieldIndex + 1}`}
              </p>
              {isRequired && <Badge variant="danger" size="sm">Required</Badge>}
            </div>
            <p className="text-sm text-gray-600">
              Type: {FIELD_TYPES.find((ft) => ft.value === fieldType)?.label || fieldType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Field Editor (Expanded View) */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register(`form_schema.${fieldIndex}.field_type`, { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Field Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register(`form_schema.${fieldIndex}.field_label`, { required: true })}
              placeholder="e.g., Student Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Field ID (Auto-generated, readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field ID (Auto-generated)
            </label>
            <input
              type="text"
              {...register(`form_schema.${fieldIndex}.field_id`)}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placeholder Text
            </label>
            <input
              type="text"
              {...register(`form_schema.${fieldIndex}.placeholder`)}
              placeholder="e.g., Enter student's full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Help Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Help Text
            </label>
            <input
              type="text"
              {...register(`form_schema.${fieldIndex}.help_text`)}
              placeholder="e.g., First and last name as per ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Required Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register(`form_schema.${fieldIndex}.is_required`)}
              id={`required-${fieldIndex}`}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor={`required-${fieldIndex}`} className="ml-2 text-sm font-medium text-gray-700">
              Required field
            </label>
          </div>

          {/* Field Options (for SELECT type) */}
          {fieldType === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options (comma-separated) <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register(`form_schema.${fieldIndex}.field_options`)}
                placeholder="e.g., Option 1, Option 2, Option 3"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter options separated by commas
              </p>
            </div>
          )}

          {/* Validation Rules (for specific types) */}
          {(fieldType === 'text' || fieldType === 'textarea') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Length
                </label>
                <input
                  type="number"
                  {...register(`form_schema.${fieldIndex}.validation_rules.minLength`)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Length
                </label>
                <input
                  type="number"
                  {...register(`form_schema.${fieldIndex}.validation_rules.maxLength`)}
                  placeholder="255"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {fieldType === 'number' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Value
                </label>
                <input
                  type="number"
                  {...register(`form_schema.${fieldIndex}.validation_rules.min`)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Value
                </label>
                <input
                  type="number"
                  {...register(`form_schema.${fieldIndex}.validation_rules.max`)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormFieldEditor;
