import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const MetricCard = ({ title, value, change, icon: Icon, color, onClick, isClickable = false }) => {
  return (
    <div 
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${
        isClickable ? 'cursor-pointer transform hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center space-x-1">
          {change > 0 ? (
            <ArrowUp className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === 'string' ? value : value.toLocaleString()}
        </h3>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
};

export default React.memo(MetricCard);