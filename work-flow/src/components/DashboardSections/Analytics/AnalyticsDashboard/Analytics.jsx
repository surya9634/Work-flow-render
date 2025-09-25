import React, { useEffect, useState } from 'react';
import { FiActivity, FiClock, FiMessageSquare, FiTrendingUp, FiUsers, FiZap, FiBarChart2, FiPieChart, FiRefreshCw } from 'react-icons/fi';
import MetricCard from './MetricCard';
import LineChart from '../Charts/LineChart';
import BarChart from '../Charts/BarChart';
import DoughnutChart from '../Charts/DoughnutChart';
import AreaChart from '../Charts/AreaChart';
import ActivityFeed from './ActivityFeed';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'users', label: 'Users' },
    { id: 'campaigns', label: 'Campaigns' },
  ];

  useEffect(() => {
    let ignore = false;
    
    const loadData = async () => {
      try {
        const res = await fetch(`/api/analytics?range=${timeRange}`);
        const json = await res.json();
        if (!ignore) setData(json);
      } catch (e) {
        console.error('Error loading analytics:', e);
        if (!ignore) setData(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();
    
    // Live updates via polling
    const intervalId = setInterval(loadData, 30000);
    
    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, [timeRange]);

  const summary = data?.summary || {
    totalMessages: 0,
    responseRate: 0,
    avgResponseTime: 0,
    aiReplyRate: 0,
    engagementRate: 0,
    totalUsers: 0,
    activeCampaigns: 0,
    conversionRate: 0
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getChangeClass = (change) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const renderMetricValue = (value, isPercentage = false) => {
    if (loading) return <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>;
    if (isPercentage) return `${Math.round(value * 100)}%`;
    return formatNumber(value);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Monitor your workflow performance and engagement metrics</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh data"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Messages" 
          value={renderMetricValue(summary.totalMessages)}
          change={summary.messagesChange || 0}
          icon={<FiMessageSquare className="w-5 h-5 text-blue-500" />}
          color="blue"
          loading={loading}
        />
        <MetricCard 
          title="Response Rate" 
          value={renderMetricValue(summary.responseRate, true)}
          change={summary.responseRateChange || 0}
          icon={<FiActivity className="w-5 h-5 text-green-500" />}
          color="green"
          loading={loading}
        />
        <MetricCard 
          title="Avg. Response Time" 
          value={summary.avgResponseTime ? `${Math.round(summary.avgResponseTime)}s` : '—'}
          change={summary.responseTimeChange || 0}
          changeInverted={true}
          icon={<FiClock className="w-5 h-5 text-purple-500" />}
          color="purple"
          loading={loading}
        />
        <MetricCard 
          title="Engagement Rate" 
          value={renderMetricValue(summary.engagementRate, true)}
          change={summary.engagementChange || 0}
          icon={<FiUsers className="w-5 h-5 text-orange-500" />}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Message Volume */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Message Volume</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">Messages</button>
              <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full">Users</button>
            </div>
          </div>
          <div className="h-80">
            <AreaChart data={data?.messageVolume || { labels: [], datasets: [] }} loading={loading} />
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Platform Distribution</h3>
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>Messages</option>
              <option>Users</option>
              <option>Engagement</option>
            </select>
          </div>
          <div className="h-80">
            <DoughnutChart data={data?.platformDistribution || { labels: [], datasets: [] }} loading={loading} />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response Times */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Response Times</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">Avg. Time</button>
              <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full">By Hour</button>
            </div>
          </div>
          <div className="h-64">
            <BarChart data={data?.responseTimes || { labels: [], datasets: [] }} loading={loading} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
              Live
            </span>
          </div>
          <ActivityFeed data={data?.activityFeed || []} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
