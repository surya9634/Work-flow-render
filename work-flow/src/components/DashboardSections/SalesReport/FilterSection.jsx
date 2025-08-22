import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import FilterPanel from './FilterPanel';

const FilterSection = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  showFilters, 
  onToggleFilters,
  statuses 
}) => {
  // Count active filters (excluding search)
  const activeFilterCount = Object.entries(filters)
    .filter(([key, value]) => key !== 'search' && value)
    .length;

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales data..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={onToggleFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={onFilterChange}
          statuses={statuses}
        />
      )}
    </div>
  );
};

export default React.memo(FilterSection);