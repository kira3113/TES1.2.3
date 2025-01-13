import { useState } from 'react';
import { Calendar, BarChart2, Package, Users, Download, Upload } from 'lucide-react';
import { SalesReports } from '../components/reports/SalesReports';
import { InventoryReports } from '../components/reports/InventoryReports';
import { CustomerReports } from '../components/reports/CustomerReports';
import { localDB } from '../lib/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { StaffSalesReport } from '../components/reports/StaffSalesReport';

type ReportType = 'sales' | 'inventory' | 'customers' | 'backup';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)), // First day of current month
    end: new Date()
  });
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { session } = useAuth();
  const { hasPermission } = usePermissions(session?.roleId || '');

  if (!hasPermission('view_reports')) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">You don't have permission to view reports.</p>
      </div>
    );
  }

  const reportTypes = [
    { 
      id: 'sales', 
      name: 'Sales Reports', 
      icon: BarChart2,
      description: 'View sales performance, revenue trends, and order analytics'
    },
    { 
      id: 'inventory', 
      name: 'Inventory Reports', 
      icon: Package,
      description: 'Track stock levels, product performance, and category analysis'
    },
    { 
      id: 'customers', 
      name: 'Customer Reports', 
      icon: Users,
      description: 'Analyze customer behavior, loyalty, and purchase patterns'
    },
    { 
      id: 'backup', 
      name: 'Backup & Restore', 
      icon: Download,
      description: 'Manage data backups and restore points'
    }
  ];

  const handleBackup = () => {
    try {
      localDB.exportBackup();
      setStatus('Backup created successfully');
      setError('');
    } catch (err) {
      setError('Failed to create backup');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await localDB.restoreBackup(file);
      setStatus('Data restored successfully');
      setError('');
    } catch (err) {
      setError('Failed to restore data');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-500">Analyze your business performance</p>
        </div>
        <button
          onClick={() => {/* Add export functionality */}}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
        <Calendar className="text-gray-400" size={20} />
        <input
          type="date"
          value={dateRange.start.toISOString().split('T')[0]}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
          className="border rounded-lg px-3 py-2"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={dateRange.end.toISOString().split('T')[0]}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
          className="border rounded-lg px-3 py-2"
        />
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-3 gap-4">
        {reportTypes.map(report => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id as ReportType)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === report.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <report.icon 
                size={24} 
                className={selectedReport === report.id ? 'text-blue-500' : 'text-gray-400'} 
              />
              <div className="text-left">
                <h3 className={`font-medium ${
                  selectedReport === report.id ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {report.name}
                </h3>
                <p className="text-sm text-gray-500">{report.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {selectedReport === 'sales' && (
          <SalesReports dateRange={dateRange} />
        )}
        {selectedReport === 'inventory' && (
          <InventoryReports />
        )}
        {selectedReport === 'customers' && (
          <CustomerReports dateRange={dateRange} />
        )}
        {selectedReport === 'backup' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Backup Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Create Backup</h3>
                <p className="text-gray-600">Export all your data to a backup file</p>
                <button
                  onClick={handleBackup}
                  className="w-full p-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  <Download size={20} />
                  Download Backup
                </button>
              </div>
              
              {/* Restore Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Restore Data</h3>
                <p className="text-gray-600">Restore data from a backup file</p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden"
                    id="restore-file"
                  />
                  <label
                    htmlFor="restore-file"
                    className="w-full p-4 flex items-center justify-center gap-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 cursor-pointer"
                  >
                    <Upload size={20} />
                    Select Backup File
                  </label>
                </div>
              </div>
            </div>
            
            {/* Status Messages */}
            {status && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                ✅ {status}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                ❌ {error}
              </div>
            )}
            
            {/* Backup History */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Backup History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Last backup: {localDB.getBackupStatus().lastBackup || 'Never'}</span>
                  <span>Total backups: {localDB.getBackupStatus().totalBackups}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add the staff sales report */}
      <div className="mb-8">
        <StaffSalesReport />
      </div>
    </div>
  );
}