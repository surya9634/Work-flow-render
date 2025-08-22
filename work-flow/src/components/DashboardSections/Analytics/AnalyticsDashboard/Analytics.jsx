import React from 'react';
import MetricCard from './MetricCard';
import LineChart from '../Charts/LineChart';
import BarChart from '../Charts/BarChart';
import DoughnutChart from '../Charts/DoughnutChart';
import AreaChart from '../Charts/AreaChart';
import { mockData } from '../../../data/mockData';

const Analytics = () => {
  return (
        <main className="flex-1 p-6 overflow-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Messages Processed"
              value="24,847"
              change="+12.5%"
              changeType="positive"
              icon="messages"
            />
            <MetricCard
              title="Response Rate"
              value="94.2%"
              change="+5.8%"
              changeType="positive"
              icon="trending-up"
            />
            <MetricCard
              title="Average Response Time"
              value="1.2s"
              change="-0.3s"
              changeType="positive"
              icon="clock"
            />
            <MetricCard
              title="AI Accuracy Score"
              value="97.8%"
              change="+2.1%"
              changeType="positive"
              icon="brain"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Workflow Performance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                AI Workflow Performance
              </h3>
              <LineChart data={mockData.workflowPerformance} />
            </div>

            {/* Platform Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Platform Distribution
              </h3>
              <DoughnutChart data={mockData.platformDistribution} />
            </div>
          </div>

          {/* Engagement Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Engagement Rate by Platform
              </h3>
              <AreaChart data={mockData.engagementRate} />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Response Types
              </h3>
              <BarChart data={mockData.responseTypes} />
            </div>
          </div>

          {/* Real-time Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Real-time Activity Feed
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {mockData.activityFeed.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-medium">
                        {activity.platform.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
  );
};

export default Analytics;
