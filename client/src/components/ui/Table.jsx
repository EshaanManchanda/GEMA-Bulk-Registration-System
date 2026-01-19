import React from 'react';
import { cn } from '../../utils/helpers';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

/**
 * Table Component
 * Responsive table with sorting, loading, and empty states
 * Mobile-first with card layout on small screens
 */
const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick = null,
  className = '',
  ...props
}) => {
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className={cn('table', className)} {...props}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="text-gray-400">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 8a1 1 0 011.707-.707L10 10.586l3.293-3.293A1 1 0 1114.707 8.707l-4 4a1 1 0 01-1.414 0l-4-4A1 1 0 015 8z" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.cellClassName}>
                    {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedData.map((row, rowIndex) => (
          <div
            key={row.id || rowIndex}
            className={cn(
              'card',
              onRowClick && 'cursor-pointer'
            )}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-start py-2 border-b last:border-b-0">
                <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                <span className="text-sm text-gray-900 text-right ml-4">
                  {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

/**
 * Simple Table Component (without sorting/features)
 */
const SimpleTable = ({ children, className = '', ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('table', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

/**
 * Table Head Component
 */
const TableHead = ({ children, className = '', ...props }) => {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
};

/**
 * Table Body Component
 */
const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={cn('divide-y divide-gray-200', className)} {...props}>
      {children}
    </tbody>
  );
};

/**
 * Table Row Component
 */
const TableRow = ({ children, className = '', onClick = null, ...props }) => {
  return (
    <tr
      className={cn(onClick && 'cursor-pointer', className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
};

/**
 * Table Header Cell Component
 */
const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
};

/**
 * Table Cell Component
 */
const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
};

// Export table components
Table.Simple = SimpleTable;
Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Header = TableHeader;
Table.Cell = TableCell;

export default Table;
