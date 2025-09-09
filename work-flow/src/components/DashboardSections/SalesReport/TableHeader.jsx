import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const TableHeader = ({ sortConfig, onSort }) => {
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'amount', label: 'Amount' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' }
  ];

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <thead className="bg-gray-50 sticky top-0">
      <tr>
        {columns.map(column => (
          <th
            key={column.key}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            <button
              onClick={() => onSort(column.key)}
              className="flex items-center space-x-1 hover:text-gray-700"
            >
              <span>{column.label}</span>
              {getSortIcon(column.key)}
            </button>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default React.memo(TableHeader);