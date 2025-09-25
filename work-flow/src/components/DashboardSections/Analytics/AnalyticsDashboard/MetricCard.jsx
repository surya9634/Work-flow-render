import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const MetricCard = ({ 
  title, 
  value, 
  change = 0, 
  icon, 
  color = 'blue',
  loading = false,
  changeInverted = false,
  className = ''
}) => {
  // Determine if change is positive/negative based on changeInverted prop
  const isPositive = changeInverted ? change < 0 : change > 0;
  const isNeutral = change === 0;
  
  // Color mapping
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      icon: 'text-blue-500',
      change: {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-gray-500'
      }
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-100',
      icon: 'text-green-500',
      change: {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-gray-500'
      }
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      icon: 'text-purple-500',
      change: {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-gray-500'
      }
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100',
      icon: 'text-orange-500',
      change: {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-gray-500'
      }
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-100',
      icon: 'text-red-500',
      change: {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-gray-500'
      }
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      icon: 'text-indigo-500',
      change: {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-gray-500'
      }
    },
  };

  const colors = colorMap[color] || colorMap.blue;
  
  // Format change value with + or - sign
  const formatChange = (val) => {
    if (val === 0) return '0%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val}%`;
  };

  // Get change text color class
  const getChangeColor = () => {
    if (isNeutral) return colors.change.neutral;
    return isPositive ? colors.change.positive : colors.change.negative;
  };

  // Skeleton loader
  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse"></div>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
          {React.cloneElement(icon, { className: `w-5 h-5 ${colors.icon}` })}
        </div>
        
        {!isNaN(change) && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${getChangeColor()}`}>
            {!isNeutral && (
              isPositive ? (
                <FiTrendingUp className="w-4 h-4" />
              ) : (
                <FiTrendingDown className="w-4 h-4" />
              )
            )}
            <span>{formatChange(change)}</span>
            <span className="text-xs text-gray-400">vs last period</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
};

export default MetricCard;
