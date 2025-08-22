import React from 'react';
import { Package } from 'lucide-react';
import TableHeader from './TableHeader';
import TableRow from './TableRow';

const SalesTable = ({ data, sortConfig, onSort }) => {
  if (data.length === 0) {
    return (
      <div className="flex-1 overflow-auto bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No sales data found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search criteria</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="min-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeader sortConfig={sortConfig} onSort={onSort} />
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((sale) => (
              <TableRow key={sale.id} sale={sale} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(SalesTable);