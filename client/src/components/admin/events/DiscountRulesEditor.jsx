import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button, Badge } from '../../ui';

/**
 * Discount Rules Editor
 * Manage bulk discount tiers
 */
const DiscountRulesEditor = () => {
  const { control, register, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bulk_discount_rules',
  });

  const discountRules = watch('bulk_discount_rules') || [];

  const addDiscount = () => {
    append({
      min_students: '',
      discount_percentage: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Discount Rules</h3>
          <p className="text-sm text-gray-600 mt-1">
            Offer discounts for schools registering multiple students
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addDiscount}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tier
        </Button>
      </div>

      {/* Discount Tiers */}
      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-3">No discount rules configured</p>
          <p className="text-sm text-gray-500 mb-4">
            Add discount tiers to encourage bulk registrations
          </p>
          <Button type="button" variant="primary" onClick={addDiscount}>
            Add First Discount Tier
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Tier Number */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{index + 1}</span>
                </div>

                {/* Input Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Students <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register(`bulk_discount_rules.${index}.min_students`, {
                        required: true,
                        min: 1,
                        valueAsNumber: true,
                      })}
                      placeholder="e.g., 50"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum number of students required
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Percentage <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        {...register(`bulk_discount_rules.${index}.discount_percentage`, {
                          required: true,
                          min: 0,
                          max: 100,
                          valueAsNumber: true,
                        })}
                        placeholder="e.g., 10"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Discount applied (0-100%)
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Remove this discount tier?')) {
                      remove(index);
                    }
                  }}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Preview */}
              {discountRules[index]?.min_students && discountRules[index]?.discount_percentage && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Badge variant="success">
                    {discountRules[index].discount_percentage}% OFF for {discountRules[index].min_students}+ students
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      {fields.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                {fields.length} discount tier{fields.length !== 1 ? 's' : ''} configured
              </p>
              <p className="text-sm text-green-700 mt-1">
                Discounts will be automatically applied based on the number of students in the batch.
                Make sure minimum student values don't overlap.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Example */}
      {fields.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Example Discount Structure:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 50+ students: 5% discount</li>
            <li>• 100+ students: 10% discount</li>
            <li>• 200+ students: 15% discount</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiscountRulesEditor;
