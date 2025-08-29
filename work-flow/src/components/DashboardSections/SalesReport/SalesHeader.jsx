import React from 'react';
import { Download, Plus } from 'lucide-react';
import SummaryCards from './SummaryCards';

const SalesHeader = ({ onExport, isExporting, exportProgress, hasData, summaryStats, onAddOrder }) => {
  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales & Reports</h2>
          <p className="text-gray-600 mt-1">Track and analyze your sales performance</p>
        </div>
        <div className="flex items-center gap-3">
          {onAddOrder && (
            <button
              onClick={onAddOrder}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Order</span>
            </button>
          )}
          <button
            onClick={onExport}
            disabled={isExporting || !hasData}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Exporting... {exportProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export to Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards stats={summaryStats} />
    </div>
  );
};

export default React.memo(SalesHeader);