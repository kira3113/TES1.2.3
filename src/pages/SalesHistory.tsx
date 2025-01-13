import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { localDB } from '../lib/localStorage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Clock, X, Printer, Download, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { InvoiceStatusPieChart } from '../components/reports/InvoiceStatusPieChart';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';
import toast from 'react-hot-toast';
import type { Sale, SaleItem } from '@/types';

interface PurchaseDetails {
  invoice: string;
  date: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  total: number;
  status: 'paid' | 'pending';
  payment_method?: string;
}

interface TransactionStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageTransactionValue: number;
  totalTransactionVolume: number;
}

const exportToExcel = (invoice: PurchaseDetails) => {
  const workbook = XLSX.utils.book_new();
  
  // Products worksheet
  const productsData = invoice.products.map(p => ({
    'Product Name': p.name,
    'Category': p.category,
    'Quantity': p.quantity,
    'Unit Price': p.price,
    'Total': p.price * p.quantity
  }));
  const productsSheet = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

  // Invoice details worksheet
  const invoiceData = [{
    'Invoice Number': invoice.invoice,
    'Date': format(new Date(invoice.date), 'MMM d, yyyy h:mm a'),
    'Status': invoice.status,
    'Total Amount': invoice.total,
    'Payment Method': invoice.payment_method || 'N/A'
  }];
  const invoiceSheet = XLSX.utils.json_to_sheet(invoiceData);
  XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoice Details');

  // Save the file
  XLSX.writeFile(workbook, `Invoice-${invoice.invoice}.xlsx`);
};

const exportToCSV = (invoice: PurchaseDetails) => {
  const headers = ['Product Name,Category,Quantity,Unit Price,Total'];
  const rows = invoice.products.map(p => 
    `${p.name},${p.category},${p.quantity},${p.price},${p.price * p.quantity}`
  );
  const csv = [...headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `Invoice-${invoice.invoice}.csv`);
};

export function SalesHistory() {
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    averageTransactionValue: 0,
    totalTransactionVolume: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedInvoice(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Move these outside of render to prevent recalculations on every render
  const allSales = useMemo(() => localDB.getAll('sales') as Sale[], []);
  
  const totalRevenue = useMemo(() => 
    allSales.reduce((sum, sale) => sum + sale.total, 0)
  , [allSales]);

  const averageOrderValue = useMemo(() => 
    totalRevenue / (allSales.length || 1)
  , [totalRevenue, allSales.length]);

  const lastSaleDate = useMemo(() => 
    allSales.length > 0 ? new Date(allSales[0].created_at) : null
  , [allSales]);

  const daysSinceLastSale = useMemo(() => 
    lastSaleDate ? 
      Math.floor((new Date().getTime() - lastSaleDate.getTime()) / (1000 * 3600 * 24)) 
      : null
  , [lastSaleDate]);

  // Sort sales by date
  const sortedSales = [...allSales].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate category distribution
  const categoryDistribution = allSales.reduce((acc, sale) => {
    if (sale.products) {
      sale.products.forEach((product) => {
        const category = product.category || 'Other';
        acc[category] = (acc[category] || 0) + (product.price * product.quantity);
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([name, value]) => ({
      name,
      value
    }));

  const handleInvoiceClick = (sale: Sale) => {
    setSelectedInvoice({
      invoice: sale.invoice_number,
      date: sale.created_at,
      products: sale.products,
      total: sale.total,
      status: sale.payment_status,
      payment_method: 'N/A'
    });
  };

  const handleCopyInvoice = async () => {
    if (selectedInvoice) {
      await navigator.clipboard.writeText(selectedInvoice.invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate transaction statistics
  useEffect(() => {
    const stats: TransactionStats = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
      averageTransactionValue: 0,
      totalTransactionVolume: 0
    };

    allSales.forEach(sale => {
      stats.totalTransactions++;
      stats.totalTransactionVolume += sale.total;

      if (sale.payment_status === 'paid') {
        stats.successfulTransactions++;
      } else if (sale.payment_status === 'pending') {
        stats.pendingTransactions++;
      } else {
        stats.failedTransactions++;
      }
    });

    stats.averageTransactionValue = stats.totalTransactionVolume / (stats.totalTransactions || 1);
    setTransactionStats(stats);
  }, [allSales]); // Only depend on allSales

  // Prepare data for invoice status chart
  const invoiceStatusData = useMemo(() => [
    { 
      status: 'paid' as const, 
      value: transactionStats.successfulTransactions, 
      count: transactionStats.successfulTransactions 
    },
    { 
      status: 'pending' as const, 
      value: transactionStats.pendingTransactions, 
      count: transactionStats.pendingTransactions 
    },
    { 
      status: 'overdue' as const, 
      value: transactionStats.failedTransactions, 
      count: transactionStats.failedTransactions 
    }
  ], [transactionStats]);

  // Add this function to handle date range filtering
  const getDateRange = (range: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    switch (range) {
      case 'day':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
    }
  };

  // Handle filtering
  useEffect(() => {
    const { start, end } = getDateRange(dateRange);
    
    let filtered = allSales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= start && saleDate <= end;
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => {
        const customer = localDB.getAll('customers').find(c => c.id === sale.customer_id);
        return (
          sale.invoice_number.toLowerCase().includes(term) ||
          customer?.name.toLowerCase().includes(term) ||
          sale.products.some(p => p.name.toLowerCase().includes(term))
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.payment_status === statusFilter);
    }

    setFilteredSales(filtered);
  }, [allSales, dateRange, searchTerm, statusFilter]); // Add all dependencies

  // Memoize the customers data to prevent unnecessary lookups
  const customers = useMemo(() => localDB.getAll('customers'), []);

  // Memoize the getCustomerName function
  const getCustomerName = useCallback((customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  }, [customers]);

  const handleEdit = (sale: Sale) => {
    const items: SaleItem[] = sale.products.map(p => ({
      product_name: p.name,
      total_price: p.price * p.quantity
    }));

    const updatedSale: Sale = {
      ...sale,
      final_amount: sale.total,
      items: items,
      invoice_status: sale.payment_status === 'paid' ? 'paid' : 'pending',
      payment_due_date: new Date().toISOString()
    };

    setEditingSale(updatedSale);
  };

  const handleDelete = async (saleId: string) => {
    try {
      localDB.delete('sales', saleId);
      toast.success('Transaction deleted successfully');
      // Refresh the data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete transaction');
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-4 py-2 rounded-lg ${
                dateRange === range 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ShoppingBag size={20} />
            <h3 className="text-sm text-gray-500">Total Transactions</h3>
          </div>
          <p className="text-2xl font-bold">{transactionStats.totalTransactions}</p>
          <p className="text-sm text-gray-500 mt-1">
            Success Rate: {((transactionStats.successfulTransactions / transactionStats.totalTransactions) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <DollarSign size={20} />
            <h3 className="text-sm text-gray-500">Total Revenue</h3>
          </div>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Avg: ${averageOrderValue.toFixed(2)}/sale</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <TrendingUp size={20} />
            <h3 className="text-sm text-gray-500">Sales Frequency</h3>
          </div>
          <p className="text-2xl font-bold">
            {(allSales.length / (daysSinceLastSale || 1) * 30).toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Sales per month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Clock size={20} />
            <h3 className="text-sm text-gray-500">Last Sale</h3>
          </div>
          <p className="text-2xl font-bold">
            {daysSinceLastSale} days ago
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {lastSaleDate ? format(lastSaleDate, 'MMM d, yyyy') : 'Never'}
          </p>
        </div>
      </div>

      {/* Add Transaction Status Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4">Transaction Status</h2>
          <InvoiceStatusPieChart data={invoiceStatusData} />
        </div>

        {/* Keep existing charts */}
        {/* ... */}
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-4">Sales Trend</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedSales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="created_at" 
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="total" fill="#3B82F6" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-4">Sales by Category</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
              >
                {pieData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(${index * 60}, 70%, 50%)`}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Transaction List</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search transactions..."
              className="px-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="px-4 py-2 border rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr 
                  key={sale.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleInvoiceClick(sale)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(sale.created_at), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {sale.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCustomerName(sale.customer_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.products.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${sale.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sale.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.payment_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(sale);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(sale.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No transactions found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add transaction stats for the filtered period */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 mb-2">
          {dateRange.charAt(0).toUpperCase() + dateRange.slice(1)} Statistics
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-lg font-bold">{filteredSales.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-lg font-bold">
              ${filteredSales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Transaction</p>
            <p className="text-lg font-bold">
              ${(filteredSales.reduce((sum, sale) => sum + sale.total, 0) / (filteredSales.length || 1)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedInvoice(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full my-8 shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold">Purchase Details</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedInvoice.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopyInvoice}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Printer size={20} />
                  </button>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{selectedInvoice.invoice}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedInvoice.status === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Products Table */}
              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.products.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${product.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${(product.price * product.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        ${selectedInvoice.total.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                <div className="relative group">
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Download size={18} />
                    Export
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block">
                    <button
                      onClick={() => exportToExcel(selectedInvoice)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-t-lg"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => exportToCSV(selectedInvoice)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-b-lg"
                    >
                      Export to CSV
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Printer size={18} />
                  Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingSale && (
        <EditTransactionModal
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onUpdate={() => {
            // Refresh the data
            window.location.reload();
          }}
        />
      )}

      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 