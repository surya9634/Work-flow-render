import React from 'react';
import { Check } from 'lucide-react';

const ExportProgress = ({ progress }) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="#10b981"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {progress === 100 ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <span className="text-lg font-semibold">{progress}%</span>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-gray-700 font-medium">
          {progress === 100 ? 'Export Complete!' : 'Exporting to Excel...'}
        </p>
        <p className="text-center text-sm text-gray-500 mt-1">
          {progress === 100 ? 'Your download will start shortly' : 'Please wait while we prepare your file'}
        </p>
      </div>
    </div>
  );
};

export default React.memo(ExportProgress);