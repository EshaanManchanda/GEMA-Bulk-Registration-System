import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FormFieldEditor from './FormFieldEditor';
import { Button, Modal, Badge } from '../../ui';

/**
 * Draggable Field Item
 */
const DraggableField = ({ field, index, moveField, children }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'FIELD',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'FIELD',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveField(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {children}
    </div>
  );
};

/**
 * Form Schema Builder
 * Drag-and-drop form field builder
 */
const FormSchemaBuilder = () => {
  const { control, watch } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'form_schema',
  });

  const [expandedField, setExpandedField] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const formSchema = watch('form_schema') || [];

  const addField = () => {
    append({
      field_id: `field_${Date.now()}`,
      field_label: '',
      field_type: 'text',
      is_required: false,
      placeholder: '',
      help_text: '',
      validation_rules: {},
      field_options: '',
      order: fields.length,
    });
    setExpandedField(fields.length);
  };

  const moveField = (fromIndex, toIndex) => {
    move(fromIndex, toIndex);
  };

  const toggleExpanded = (index) => {
    setExpandedField(expandedField === index ? null : index);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Registration Form Fields</h3>
            <p className="text-sm text-gray-600 mt-1">
              Design the fields that schools will fill when registering students
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={fields.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Form
            </Button>
            <Button type="button" variant="primary" onClick={addField}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Field
            </Button>
          </div>
        </div>

        {/* Fields List */}
        {fields.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fields added yet</h3>
            <p className="text-gray-600 mb-4">
              Click "Add Field" to start building your registration form
            </p>
            <Button type="button" variant="primary" onClick={addField}>
              Add Your First Field
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <DraggableField
                key={field.id}
                field={field}
                index={index}
                moveField={moveField}
              >
                <FormFieldEditor
                  fieldIndex={index}
                  onRemove={() => {
                    if (window.confirm('Are you sure you want to remove this field?')) {
                      remove(index);
                      if (expandedField === index) {
                        setExpandedField(null);
                      }
                    }
                  }}
                  isExpanded={expandedField === index}
                  onToggle={() => toggleExpanded(index)}
                />
              </DraggableField>
            ))}
          </div>
        )}

        {/* Info Box */}
        {fields.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {fields.length} field{fields.length !== 1 ? 's' : ''} configured
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Drag and drop to reorder fields. Click to expand and edit field properties.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Form Preview"
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                This is a preview of how the form will appear to schools during registration.
              </p>
            </div>

            {/* Preview Form */}
            <div className="space-y-4">
              {formSchema.map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.field_label || `Field ${index + 1}`}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.field_type === 'text' && (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}

                  {field.field_type === 'number' && (
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}

                  {field.field_type === 'email' && (
                    <input
                      type="email"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}

                  {field.field_type === 'date' && (
                    <input
                      type="date"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}

                  {field.field_type === 'select' && (
                    <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <option>{field.placeholder || 'Select an option'}</option>
                      {field.field_options?.split(',').map((opt, i) => (
                        <option key={i}>{opt.trim()}</option>
                      ))}
                    </select>
                  )}

                  {field.field_type === 'textarea' && (
                    <textarea
                      placeholder={field.placeholder}
                      disabled
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}

                  {field.field_type === 'checkbox' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        disabled
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{field.placeholder}</span>
                    </div>
                  )}

                  {field.field_type === 'file' && (
                    <input
                      type="file"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}

                  {field.field_type === 'url' && (
                    <input
                      type="url"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}

                  {field.help_text && (
                    <p className="text-xs text-gray-500">{field.help_text}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="primary" onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default FormSchemaBuilder;
