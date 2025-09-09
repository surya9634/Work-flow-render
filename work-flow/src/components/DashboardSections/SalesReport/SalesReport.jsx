import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Package } from 'lucide-react';
import * as XLSX from 'xlsx';

// Import sub-components
import SalesHeader from './SalesHeader';
import FilterSection from './FilterSection';
import SalesTable from './SalesTable';
import ExportProgress from './ExportProgress';
import { salesData as initialSalesData } from '../../data/salesData';
// import SalesReportWithNotifications from './DailyNotifications';
import BarChart from '../Analytics/Charts/BarChart';
import LineChart from '../Analytics/Charts/LineChart';
import DoughnutChart from '../Analytics/Charts/DoughnutChart';
import AddOrderModal from './AddOrderModal';

const SalesReport = () => {
  // State management
  const [salesData, setSalesData] = useState(initialSalesData);
  const [insights, setInsights] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    status: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Load real orders + AI insights
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [ordersRes, insightsRes] = await Promise.all([
          fetch('/api/sales/report'),
          fetch('/api/sales/insights')
        ]);
        const ordersJson = await ordersRes.json().catch(() => null);
        const insightsJson = await insightsRes.json().catch(() => null);
        if (!ignore) {
          if (ordersJson && ordersJson.ok && Array.isArray(ordersJson.data)) {
            // Normalize field casing to match UI expectations
            const normalized = ordersJson.data.map(o => ({
              ...o,
              status: (o.status || '').charAt(0).toUpperCase() + (o.status || '').slice(1)
            }));
            setSalesData(normalized.length ? normalized : initialSalesData);
          }
          if (insightsJson && insightsJson.ok) setInsights(insightsJson.insights || null);
        }
      } catch (_) {
        if (!ignore) {
          // keep fallback
        }
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { ignore = true; clearInterval(id); };
  }, []);

  // Memoized unique values for filters
  const statuses = useMemo(() => (
    [...new Set(salesData.map(item => item.status))]
  ), [salesData]);

  // Optimized filter function
  const filterData = useCallback((data, filters) => {
    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const found = Object.values(item).some(val => 
          val?.toString?.().toLowerCase().includes(searchLower)
        );
        if (!found) return false;
      }

      // Direct property checks
      if (filters.status && item.status !== filters.status) return false;
      if (filters.dateFrom && item.date < filters.dateFrom) return false;
      if (filters.dateTo && item.date > filters.dateTo) return false;

      // Amount filters with parsed values
      const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : null;
      const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : null;
      if (minAmount !== null && item.amount < minAmount) return false;
      if (maxAmount !== null && item.amount > maxAmount) return false;

      return true;
    });
  }, []);

  // Optimized sort function
  const sortData = useCallback((data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[config.key];
      const bValue = b[config.key];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return config.direction === 'asc' ? comparison : -comparison;
    });
  }, []);

  // Filter and sort data with memoization
  const filteredAndSortedData = useMemo(() => {
    const filtered = filterData(salesData, filters);
    return sortData(filtered, sortConfig);
  }, [salesData, filters, sortConfig, filterData, sortData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const filtered = filteredAndSortedData;
    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    const totalQuantity = filtered.reduce((sum, item) => sum + item.quantity, 0);
    const avgOrder = filtered.length > 0 ? total / filtered.length : 0;

    return {
      totalSales: total,
      totalOrders: filtered.length,
      totalQuantity,
      avgOrderValue: avgOrder
    };
  }, [filteredAndSortedData]);

  // Chart data
  const revenueByProduct = useMemo(() => {
    const byProduct = new Map();
    for (const o of filteredAndSortedData) {
      byProduct.set(o.product, (byProduct.get(o.product) || 0) + Number(o.amount || 0));
    }
    const labels = Array.from(byProduct.keys());
    const values = Array.from(byProduct.values());
    return {
      labels,
      datasets: [{
        label: 'Revenue',
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        borderColor: 'rgb(59, 130, 246)'
      }]
    };
  }, [filteredAndSortedData]);

  const ordersOverTime = useMemo(() => {
    const byDate = new Map();
    for (const o of filteredAndSortedData) {
      const d = String(o.date).slice(0,10);
      byDate.set(d, (byDate.get(d) || 0) + 1);
    }
    const labels = Array.from(byDate.keys()).sort();
    const values = labels.map(d => byDate.get(d));
    return {
      labels,
      datasets: [{
        label: 'Orders',
        data: values,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true
      }]
    };
  }, [filteredAndSortedData]);

  const statusDistribution = useMemo(() => {
    const byStatus = new Map();
    for (const o of filteredAndSortedData) {
      byStatus.set(o.status, (byStatus.get(o.status) || 0) + 1);
    }
    const labels = Array.from(byStatus.keys());
    const values = labels.map(s => byStatus.get(s));
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['rgb(59,130,246)','rgb(16,185,129)','rgb(245,158,11)','rgb(239,68,68)']
      }]
    };
  }, [filteredAndSortedData]);

  // Handler functions
  const handleSort = useCallback((key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(current => ({ ...current, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      status: ''
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Export to Excel with progress simulation
  const exportToExcel = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Prepare data for export
      const exportData = filteredAndSortedData.map(item => ({
        'Date': item.date,
        'Product': item.product,
        'Quantity': item.quantity,
        'Amount': `$${item.amount.toFixed(2)}`,
        'Customer': item.customer,
        'Status': item.status
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

      // Complete progress
      clearInterval(progressInterval);
      setExportProgress(100);

      // Download file
      setTimeout(() => {
        XLSX.writeFile(wb, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExporting(false);
        setExportProgress(0);
      }, 500);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [filteredAndSortedData]);

  const InsightBadge = ({ label, value }) => (
    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="h-full w-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <SalesHeader 
          onExport={exportToExcel}
          isExporting={isExporting}
          exportProgress={exportProgress}
          hasData={filteredAndSortedData.length > 0}
          summaryStats={summaryStats}
          onAddOrder={() => setShowAddOrder(true)}
        />

        {/* Main content with right sidebar */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filters and Search */}
              <FilterSection
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                showFilters={showFilters}
                onToggleFilters={toggleFilters}
                statuses={statuses}
              />

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue by Product */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Revenue by Product</h3>
                  <BarChart data={revenueByProduct} />
                </div>
                {/* Orders over Time */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Orders over Time</h3>
                  <LineChart data={ordersOverTime} />
                </div>
                {/* Status Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Status Distribution</h3>
                  <DoughnutChart data={statusDistribution} />
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <SalesTable
                  data={filteredAndSortedData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </div>
            </div>

            {/* Insights sidebar */}
            <aside className="lg:col-span-1">
              {insights && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Top by Interest</h4>
                    <div className="space-y-2">
                      {(insights.topProductsByInterest || []).slice(0,5).map((p, i) => (
                        <InsightBadge key={i} label={p.product} value={`${p.count}`} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Top by Revenue</h4>
                    <div className="space-y-2">
                      {(insights.topProductsByRevenue || []).slice(0,5).map((p, i) => (
                        <InsightBadge key={i} label={p.product} value={`$${Number(p.amount||0).toFixed(0)}`} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Blockers</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {insights.blockers && Object.entries(insights.blockers).map(([k,v]) => (
                        <InsightBadge key={k} label={k} value={v} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Top Features</h4>
                    <div className="space-y-2">
                      {(insights.requestedFeatures || []).map((f, i) => (
                        <InsightBadge key={i} label={f.feature} value={f.count} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Intents & Sentiment</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {insights.intents && Object.entries(insights.intents).map(([k,v]) => (
                        <InsightBadge key={k} label={k} value={v} />
                      ))}
                    </div>
                    {insights.sentiment && (
                      <div className="grid grid-cols-3 gap-2">
                        <InsightBadge label="positive" value={insights.sentiment.positive} />
                        <InsightBadge label="neutral" value={insights.sentiment.neutral} />
                        <InsightBadge label="negative" value={insights.sentiment.negative} />
                      </div>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Recommendations</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
                      {(insights.recommendations || []).slice(0,4).map((r, i) => (<li key={i}>{r}</li>))}
                    </ul>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* Export Progress Overlay */}
        {isExporting && (
          <ExportProgress progress={exportProgress} />
        )}
      </div>

      {/* Add Order Modal */}
      {showAddOrder && (
        <AddOrderModal
          onClose={() => setShowAddOrder(false)}
          onSave={async (payload) => {
            try {
              setSavingOrder(true);
              const res = await fetch('/api/sales/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const json = await res.json();
              if (json?.ok) {
                // optimistically reload orders
                setShowAddOrder(false);
              }
            } catch (_) {
            } finally {
              setSavingOrder(false);
            }
          }}
          saving={savingOrder}
        />
      )}
    </div>
  );
};

export default SalesReport;