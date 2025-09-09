import React from 'react';
import { DollarSign, TrendingUp, Package, Calendar } from 'lucide-react';

const SummaryCards = ({ stats }) => {
  const cards = [
    { title: 'Total Sales', value: `$${stats.totalSales.toFixed(2)}`, icon: DollarSign },
    { title: 'Total Orders', value: stats.totalOrders, icon: TrendingUp },
    { title: 'Items Sold', value: stats.totalQuantity, icon: Package },
    { title: 'Avg Order Value', value: `$${stats.avgOrderValue.toFixed(2)}`, icon: Calendar }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">{card.title}</p>
              <p className="text-xl font-semibold text-gray-900">{card.value}</p>
            </div>
            <card.icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(SummaryCards);