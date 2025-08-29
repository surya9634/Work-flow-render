import React from 'react';
import { Download, Plus } from 'lucide-react';
import SummaryCards from './SummaryCards';

const SalesHeader = ({ onExport, isExporting, exportProgress, hasData, summaryStats, onAddOrder }) => {
  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Sales & Reports</h2>
          <p className="text-gray-600 mt-0.5 text-sm">Track and analyze your sales performance</p>
        </div>
        <div className="flex items-center gap-2">
          {onAddOrder && (
            <button
              onClick={onAddOrder}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Order</span>
            </button>
          )}
          <button
            onClick={onExport}
            disabled={isExporting || !hasData}
            className="px-3 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Exporting... {exportProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export</span>
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