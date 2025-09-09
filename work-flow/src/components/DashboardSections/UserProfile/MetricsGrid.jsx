import React from 'react';
import { Send, Activity, Target, TrendingUp } from 'lucide-react';
import MetricCard from './MetricCard';

const MetricsGrid = ({ animatedMetrics, metrics, onRedirect }) => {
  const metricsConfig = [
    {
      title: "Total Messages Sent",
      value: animatedMetrics.totalMessages,
      change: metrics.messageGrowth,
      icon: Send,
      color: "bg-blue-500",
      onClick: () => onRedirect('messages'),
      isClickable: true
    },
    {
      title: "Active Automations",
      value: animatedMetrics.activeAutomations,
      change: metrics.automationGrowth,
      icon: Activity,
      color: "bg-green-500",
      onClick: () => onRedirect('automations'),
      isClickable: true
    },
    {
      title: "Leads Generated",
      value: animatedMetrics.leadsGenerated,
      change: metrics.leadGrowth,
      icon: Target,
      color: "bg-purple-500",
      isClickable: false
    },
    {
      title: "Engagement Rate",
      value: `${animatedMetrics.engagementRate}%`,
      change: metrics.engagementGrowth,
      icon: TrendingUp,
      color: "bg-orange-500",
      isClickable: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricsConfig.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default React.memo(MetricsGrid);