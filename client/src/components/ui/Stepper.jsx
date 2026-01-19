import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Stepper Component
 * Multi-step form progress indicator
 */
const Stepper = ({ steps = [], currentStep = 0, className = '' }) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors mb-2',
                    isCompleted && 'bg-primary-600 text-white',
                    isCurrent && 'bg-primary-600 text-white ring-4 ring-primary-100',
                    isUpcoming && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      (isCompleted || isCurrent) && 'text-gray-900',
                      isUpcoming && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  )}
                  style={{ marginTop: '-2.5rem' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
