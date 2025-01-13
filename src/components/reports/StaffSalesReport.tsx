import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { localDB } from '../../lib/localStorage';
import { Users, ChevronDown, ChevronUp, Calendar, User, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';

interface StaffSale {
  staff_id: string;
  staff_name: string;
  total: number;
  created_at: string;
  customer_name: string;
  invoice_number: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface StaffTransaction {
  date: string;
  customer: string;
  amount: number;
  invoice: string;
  items: number;
}

interface StaffMember {
  name: string;
  total_sales: number;
  total_revenue: number;
  transactions: number;
  customers: Set<string>;
  recent_transactions: StaffTransaction[];
  average_sale_value: number;
  peak_hours: { [hour: string]: number };
  top_products: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  performance_trend: {
    daily: number[];
    weekly: number[];
  };
}

type PeriodOption = { label: string; days: number | 'month' | 'all' };

export function StaffSalesReport() {
  const { session } = useAuth();
  const [staffSales, setStaffSales] = useState<{
    [key: string]: StaffMember
  }>({});
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)), // First day of current month
    end: new Date()
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high-value' | 'recent'>('all');

  const periods: PeriodOption[] = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'This Month', days: 'month' },
    { label: 'All Time', days: 'all' }
  ];

  useEffect(() => {
    const sales: StaffSale[] = localDB.getAll('sales');
    // Filter sales for current user if needed
    const filteredSales = session?.roleId === 'admin' 
      ? sales 
      : sales.filter(sale => sale.staff_id === session?.userId);
    
    console.log('Retrieved sales:', filteredSales);
    
    const staffData = filteredSales.reduce((acc, sale) => {
      const staffId = sale.staff_id;
      
      if (!acc[staffId]) {
        acc[staffId] = {
          name: sale.staff_name,
          total_sales: 0,
          total_revenue: 0,
          transactions: 0,
          customers: new Set<string>(),
          recent_transactions: [],
          average_sale_value: 0,
          peak_hours: {},
          top_products: [],
          performance_trend: {
            daily: [],
            weekly: [],
          },
        };
      }

      // Update stats
      acc[staffId].total_revenue += sale.total;
      acc[staffId].transactions += 1;
      acc[staffId].customers.add(sale.customer_name);

      // Add transaction to recent list
      acc[staffId].recent_transactions.push({
        date: format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm'),
        customer: sale.customer_name,
        amount: sale.total,
        invoice: sale.invoice_number,
        items: sale.products.reduce((sum, p) => sum + p.quantity, 0),
      });

      acc[staffId].average_sale_value = acc[staffId].total_revenue / acc[staffId].transactions;
      const hour = format(new Date(sale.created_at), 'HH:00');
      acc[staffId].peak_hours[hour] = (acc[staffId].peak_hours[hour] || 0) + 1;

      return acc;
    }, {} as { [key: string]: StaffMember });

    // Sort recent transactions by date (newest first)
    Object.values(staffData).forEach(staff => {
      staff.recent_transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    console.log('Processed staff data:', staffData);
    setStaffSales(staffData);
  }, [session]);

  const chartData = Object.entries(staffSales).map(([_, data]) => ({
    name: data.name,
    revenue: data.total_revenue,
    transactions: data.transactions,
  }));

  const handlePeriodChange = (days: PeriodOption['days']) => {
    const newDateRange = {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end)
    };

    if (typeof days === 'number') {
      if (days === 0) {
        // Today
        newDateRange.start = new Date();
        newDateRange.start.setHours(0, 0, 0, 0);
      } else {
        // Last N days
        newDateRange.start = new Date();
        newDateRange.start.setDate(newDateRange.start.getDate() - days);
      }
    } else if (days === 'month') {
      newDateRange.start = new Date();
      newDateRange.start.setDate(1);
    }
    // else 'all' - keep default dates

    setDateRange(newDateRange);
  };

  const exportData = (format: 'excel' | 'csv') => {
    const data = Object.entries(staffSales).map(([_, staff]) => ({
      'Staff Name': staff.name,
      'Total Revenue': staff.total_revenue,
      'Transactions': staff.transactions,
      'Customers': staff.customers.size,
      'Average Sale': staff.average_sale_value,
      'Recent Transactions': staff.recent_transactions
    }));

    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Staff Performance');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = `staff-performance-${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([excelBuffer]), fileName);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const fileName = `staff-performance-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName);
    }
  };

  const getPerformanceComparison = (staffId: string) => {
    const allStaff = Object.values(staffSales);
    const currentStaff = staffSales[staffId];
    
    const avgRevenue = allStaff.reduce((sum, s) => sum + s.total_revenue, 0) / allStaff.length;
    const avgTransactions = allStaff.reduce((sum, s) => sum + s.transactions, 0) / allStaff.length;
    
    return {
      revenueComparison: ((currentStaff.total_revenue - avgRevenue) / avgRevenue) * 100,
      transactionComparison: ((currentStaff.transactions - avgTransactions) / avgTransactions) * 100
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff Performance</h2>
          <p className="text-gray-500 mt-1">Track and analyze staff sales performance</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {periods.map(period => (
            <button
              key={period.label}
              onClick={() => handlePeriodChange(period.days)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all
                hover:bg-blue-50 hover:text-blue-600 border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full px-4 py-2 pl-10 border rounded-lg bg-gray-50 focus:bg-white
              transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="px-4 py-2 border rounded-lg bg-gray-50 focus:bg-white
            transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Transactions</option>
          <option value="high-value">High Value (&gt;$1000)</option>
          <option value="recent">Last 24 Hours</option>
        </select>
      </div>

      <div className="space-y-6">
        {Object.entries(staffSales).map(([id, data]) => {
          const comparison = getPerformanceComparison(id);
          return (
            <div key={id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="text-blue-500" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{data.name}</h3>
                      <p className="text-sm text-gray-500">
                        {data.customers.size} customers served
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedStaff(expandedStaff === id ? null : id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedStaff === id ? 
                      <ChevronUp size={20} className="text-gray-500" /> : 
                      <ChevronDown size={20} className="text-gray-500" />
                    }
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-600">Transactions</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {data.transactions}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-600">Revenue</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      ${data.total_revenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-600">Avg. Sale</div>
                    <div className="text-2xl font-bold text-purple-700 mt-1">
                      ${data.average_sale_value.toFixed(0)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <div className={`flex-1 p-3 rounded-lg ${
                    comparison.revenueComparison > 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="text-sm font-medium text-gray-600">Revenue vs Avg</div>
                    <div className={`text-lg font-bold ${
                      comparison.revenueComparison > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {comparison.revenueComparison > 0 ? '+' : ''}{comparison.revenueComparison.toFixed(1)}%
                    </div>
                  </div>
                  <div className={`flex-1 p-3 rounded-lg ${
                    comparison.transactionComparison > 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="text-sm font-medium text-gray-600">Transactions vs Avg</div>
                    <div className={`text-lg font-bold ${
                      comparison.transactionComparison > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {comparison.transactionComparison > 0 ? '+' : ''}{comparison.transactionComparison.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {expandedStaff === id && (
                <div className="border-t bg-gray-50 p-6">
                  <h4 className="font-medium text-gray-800 mb-4">Recent Transactions</h4>
                  <div className="space-y-3">
                    {data.recent_transactions.map((transaction, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} />
                            {transaction.date}
                          </div>
                          <div className="text-sm font-medium text-gray-500">
                            {transaction.invoice}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span className="font-medium">{transaction.customer}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              ${transaction.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.items} items
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => exportData('excel')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
            transition-colors flex items-center gap-2"
        >
          <Download size={18} />
          Export to Excel
        </button>
        <button
          onClick={() => exportData('csv')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            transition-colors flex items-center gap-2"
        >
          <Download size={18} />
          Export to CSV
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <BarChart width={600} height={300} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
          <Bar yAxisId="right" dataKey="transactions" fill="#10B981" name="Transactions" />
        </BarChart>
      </div>
    </div>
  );
} 