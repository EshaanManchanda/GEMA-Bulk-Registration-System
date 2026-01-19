import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Card Component
 * Reusable card container with optional header, body, and footer
 * Uses .card classes from global.css
 */
const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div className={cn('card', noPadding && 'p-0', className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('card-header', className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Body Component
 */
const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('card-body', className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Footer Component
 */
const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('card-footer', className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Title Component
 */
const CardTitle = ({ children, className = '', as: Component = 'h3', ...props }) => {
  return (
    <Component className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </Component>
  );
};

/**
 * Card Description Component
 */
const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={cn('text-sm text-gray-600 mt-1', className)} {...props}>
      {children}
    </p>
  );
};

// Export all card components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;
