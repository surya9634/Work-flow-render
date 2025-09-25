import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Default color palette
const defaultColors = [
  'rgba(59, 130, 246, 1)',    // blue-500
  'rgba(16, 185, 129, 1)',    // emerald-500
  'rgba(245, 158, 11, 1)',    // amber-500
  'rgba(139, 92, 246, 1)',    // violet-500
  'rgba(239, 68, 68, 1)',     // red-500
  'rgba(20, 184, 166, 1)',    // teal-500
  'rgba(249, 115, 22, 1)',    // orange-500
  'rgba(168, 85, 247, 1)',    // purple-500
];

const LineChart = ({ 
  data, 
  title, 
  height = 300,
  showLegend = true,
  showGrid = true,
  showDots = true,
  isTimeSeries = false,
  timeFormat = 'MMM d',
  xTitle,
  yTitle,
  loading = false,
  className = '',
}) => {
  const chartRef = useRef(null);

  // Process data with default colors if not provided
  const processedData = React.useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    
    return {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((dataset, i) => ({
        ...dataset,
        borderColor: dataset.borderColor || defaultColors[i % defaultColors.length],
        backgroundColor: dataset.fill 
          ? dataset.backgroundColor || `${dataset.borderColor || defaultColors[i % defaultColors.length]}20`
          : 'transparent',
        borderWidth: 2,
        pointRadius: showDots ? 3 : 0,
        pointHoverRadius: 5,
        pointBackgroundColor: dataset.borderColor || defaultColors[i % defaultColors.length],
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: dataset.borderColor || defaultColors[i % defaultColors.length],
        tension: 0.3,
        fill: dataset.fill || false,
      })),
    };
  }, [data, showDots]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
          font: {
            family: 'Inter, sans-serif',
          },
        },
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        callbacks: {
          title: (context) => {
            if (isTimeSeries && context[0]) {
              const date = new Date(context[0].label);
              return format(date, 'MMM d, yyyy h:mm a');
            }
            return context[0].label || '';
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: showGrid,
          color: 'rgba(243, 244, 246, 1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
        },
        title: xTitle ? {
          display: true,
          text: xTitle,
          color: '#6B7280',
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
        } : undefined,
      },
      y: {
        beginAtZero: true,
        grid: {
          display: showGrid,
          color: 'rgba(243, 244, 246, 1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
          callback: (value) => {
            if (value >= 1000) {
              return `${value / 1000}k`;
            }
            return value;
          },
        },
        title: yTitle ? {
          display: true,
          text: yTitle,
          color: '#6B7280',
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
        } : undefined,
      },
    },
  };

  // Skeleton loader
  if (loading) {
    return (
      <div 
        className={`bg-gray-50 rounded-lg ${className}`}
        style={{ height: `${height}px` }}
      >
        <div className="h-full w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ height: `${height}px` }}
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {title}
        </h3>
      )}
      <div className="h-full w-full">
        <Line 
          ref={chartRef}
          data={processedData} 
          options={options} 
        />
      </div>
    </div>
  );
};

export default LineChart;
