import React from 'react';
import { cn } from '../../utils/helpers';

/**
 * Pagination Component
 * Page navigation controls with jump-to-page functionality
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className = '',
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3; // Current + siblings on both sides + first + last
    const totalBlocks = totalNumbers + 2; // Including dots

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }

    return [];
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage) return;
    onPageChange(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn('flex items-center justify-center gap-2', className)}
      aria-label="Pagination"
    >
      {/* First Button */}
      {showFirstLast && (
        <button
          onClick={handleFirst}
          disabled={currentPage === 1}
          className={cn(
            'px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors',
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-50'
          )}
          aria-label="Go to first page"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
            <path d="M8.707 5.293a1 1 0 010 1.414L5.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
          </svg>
        </button>
      )}

      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={cn(
          'px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors',
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
            : 'text-gray-700 hover:bg-gray-50'
        )}
        aria-label="Go to previous page"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) => (
        <button
          key={index}
          onClick={() => handlePageClick(page)}
          disabled={page === '...'}
          className={cn(
            'min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            page === currentPage
              ? 'bg-primary-600 text-white'
              : page === '...'
              ? 'text-gray-400 cursor-default'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
          aria-label={page === '...' ? 'More pages' : `Go to page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={cn(
          'px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors',
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
            : 'text-gray-700 hover:bg-gray-50'
        )}
        aria-label="Go to next page"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
        </svg>
      </button>

      {/* Last Button */}
      {showFirstLast && (
        <button
          onClick={handleLast}
          disabled={currentPage === totalPages}
          className={cn(
            'px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors',
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-50'
          )}
          aria-label="Go to last page"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
            <path d="M11.293 14.707a1 1 0 010-1.414L14.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
          </svg>
        </button>
      )}
    </nav>
  );
};

export default Pagination;
