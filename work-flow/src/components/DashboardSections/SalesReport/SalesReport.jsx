import React, { useState, useMemo, useCallback } from 'react';
import { Package } from 'lucide-react';
import * as XLSX from 'xlsx';

// Import sub-components
import SalesHeader from './SalesHeader';
import FilterSection from './FilterSection';
import SalesTable from './SalesTable';
import ExportProgress from './ExportProgress';
import { salesData as initialSalesData } from '../../data/salesData';
// import SalesReportWithNotifications from './DailyNotifications';


const SalesReport = () => {
  // State management
  const [salesData] = useState(initialSalesData);
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

  // Memoized unique values for filters
  const { categories, statuses } = useMemo(() => ({
    statuses: [...new Set(salesData.map(item => item.status))]
  }), [salesData]);

  // Optimized filter function
  const filterData = useCallback((data, filters) => {
    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const found = Object.values(item).some(val => 
          val.toString().toLowerCase().includes(searchLower)
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
        />

        {/* < SalesReportWithNotifications
          summaryStats={summaryStats}
          onNotificationChange={(settings) => {
           // Handle notification settings change
            console.log('Settings updated:', settings);
          }}/> */}
        {/* Filters and Search */}
        <FilterSection
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          showFilters={showFilters}
          onToggleFilters={toggleFilters}
          categories={categories}
          statuses={statuses}
        />

        {/* Table */}
        <SalesTable
          data={filteredAndSortedData}
          sortConfig={sortConfig}
          onSort={handleSort}
        />

        {/* Export Progress Overlay */}
        {isExporting && (
          <ExportProgress progress={exportProgress} />
        )}
      </div>
    </div>
  );
};

export default SalesReport;