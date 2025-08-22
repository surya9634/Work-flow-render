import React from 'react';
import { DollarSign, TrendingUp, Package, Calendar } from 'lucide-react';

const SummaryCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Sales',
      value: `$${stats.totalSales.toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-600',
      valueColor: 'text-blue-900'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: TrendingUp,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
      textColor: 'text-green-600',
      valueColor: 'text-green-900'
    },
    {
      title: 'Items Sold',
      value: stats.totalQuantity,
      icon: Package,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
      textColor: 'text-purple-600',
      valueColor: 'text-purple-900'
    },
    {
      title: 'Avg Order Value',
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      icon: Calendar,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
      textColor: 'text-orange-600',
      valueColor: 'text-orange-900'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      {cards.map((card, index) => (
        <div key={index} className={`${card.bgColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${card.textColor} text-sm font-medium`}>{card.title}</p>
              <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
            </div>
            <card.icon className={`w-8 h-8 ${card.iconColor}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(SummaryCards);