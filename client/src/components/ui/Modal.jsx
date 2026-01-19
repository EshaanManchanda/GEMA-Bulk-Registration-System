import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/helpers';

/**
 * Modal Component
 * Full-screen overlay modal with backdrop and animations
 * Supports different sizes and prevents body scroll when open
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  title = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = '',
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={cn(
          'modal-content',
          sizeClasses[size],
          'animate-slide-up',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Modal Header Component
 */
const ModalHeader = ({ children, className = '' }) => {
  return (
    <div className={cn('border-b border-gray-200 pb-4 mb-4', className)}>
      {children}
    </div>
  );
};

/**
 * Modal Body Component
 */
const ModalBody = ({ children, className = '' }) => {
  return <div className={cn('py-4', className)}>{children}</div>;
};

/**
 * Modal Footer Component
 */
const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={cn('border-t border-gray-200 pt-4 mt-4 flex gap-2 justify-end', className)}>
      {children}
    </div>
  );
};

// Export modal components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
