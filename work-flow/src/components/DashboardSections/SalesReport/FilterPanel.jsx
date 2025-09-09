import React from 'react';

const FilterPanel = ({ filters, onFilterChange, Products, statuses }) => {
  const filterFields = [    {
      type: 'select',
      name: 'status',
      label: 'Status',
      value: filters.status,
      options: [
        { value: '', label: 'All Status' },
        ...statuses.map(status => ({ value: status, label: status }))
      ]
    },
    {
      type: 'date',
      name: 'dateFrom',
      label: 'Date From',
      value: filters.dateFrom
    },
    {
      type: 'date',
      name: 'dateTo',
      label: 'Date To',
      value: filters.dateTo
    },
    {
      type: 'number',
      name: 'minAmount',
      label: 'Min Amount',
      value: filters.minAmount,
      placeholder: '$0'
    },
    {
      type: 'number',
      name: 'maxAmount',
      label: 'Max Amount',
      value: filters.maxAmount,
      placeholder: '$999999'
    }
  ];

  const renderField = (field) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

    if (field.type === 'select') {
      return (
        <select
          value={field.value}
          onChange={(e) => onFilterChange(field.name, e.target.value)}
          className={baseClasses}
        >
          {field.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type}
        placeholder={field.placeholder}
        value={field.value}
        onChange={(e) => onFilterChange(field.name, e.target.value)}
        className={baseClasses}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-200 ">
      {filterFields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default React.memo(FilterPanel);