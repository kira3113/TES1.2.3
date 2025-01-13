import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { localDB } from '../lib/localStorage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Clock, X, Printer, Share2, Download, Copy, Check, History, Link, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Update interfaces to match actual data structure
interface SaleProduct {
  category: string;
  price: number;
}

interface CustomerSaleRecord {
  id: string;
  date: string;
  amount: number;
  items: number;
  invoice: string;
  status: 'paid' | 'pending';
  products: SaleProduct[];
}

interface CustomerSalesHistoryProps {
  customerId: string;
}

// Add interface for purchase details
interface PurchaseDetails {
  invoice: string;
  date: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    category: string;
    image?: string;
  }>;
  total: number;
  status: 'paid' | 'pending';
  payment_method?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// Add these functions
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

const TransactionTimeline = ({ customerId, onInvoiceClick }: { 
  customerId: string;
  onInvoiceClick: (invoice: string) => void;
}) => {
  const allSales = localDB.getCustomerSales(customerId).sales;
  
  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <History size={20} />
        Transaction History
      </h3>
      <div className="space-y-4">
        {allSales.map((sale, index) => (
          <div key={sale.id} className="relative pl-8">
            {/* Timeline connector */}
            {index !== allSales.length - 1 && (
              <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200" />
            )}
            {/* Timeline dot */}
            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              sale.status === 'paid' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                sale.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            </div>
            {/* Content */}
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex justify-between items-start">
                <div>
                  <p 
                    className="font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => onInvoiceClick(sale.invoice)}
                  >
                    Invoice #{sale.invoice}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(sale.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  sale.status === 'paid' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {(sale.status || 'pending').toUpperCase()}
                </span>
              </div>
              <p className="text-sm mt-1">{sale.items} items · ${sale.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RelatedPurchases = ({ 
  currentInvoice, 
  customerId,
  onInvoiceClick
}: { 
  currentInvoice: string;
  customerId: string;
  onInvoiceClick: (invoice: string) => void;
}) => {
  const allSales = localDB.getCustomerSales(customerId).sales;
  const currentSale = allSales.find(s => s.invoice === currentInvoice);
  
  // Find sales with similar products/categories
  const relatedSales = allSales
    .filter(sale => sale.invoice !== currentInvoice)
    .map(sale => ({
      ...sale,
      relevanceScore: sale.products.filter(p => 
        currentSale?.products.some(cp => cp.category === p.category)
      ).length
    }))
    .filter(sale => sale.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  if (relatedSales.length === 0) return null;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Link size={20} />
        Related Purchases
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {relatedSales.map(sale => (
          <div 
            key={sale.id}
            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => onInvoiceClick(sale.invoice)}
          >
            <div className="flex justify-between items-start">
              <p className="font-medium text-sm">#{sale.invoice}</p>
              <span className="text-xs text-gray-500">
                {format(new Date(sale.date), 'MMM d')}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {sale.items} items · ${sale.amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export function CustomerSalesHistory({ customerId }: CustomerSalesHistoryProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get sales data using useMemo
  const salesData = useMemo(() => localDB.getCustomerSales(customerId), [customerId]);
  
  // Calculate stats using useMemo
  const averageSpent = useMemo(() => 
    salesData.total_spent / (salesData.total_purchases || 1)
  , [salesData]);

  const lastPurchaseDate = useMemo(() => 
    salesData.last_purchase ? new Date(salesData.last_purchase) : null
  , [salesData]);

  const daysSinceLastPurchase = useMemo(() => 
    lastPurchaseDate ? 
      Math.floor((new Date().getTime() - lastPurchaseDate.getTime()) / (1000 * 3600 * 24)) 
      : null
  , [lastPurchaseDate]);

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    let filtered = [...salesData.sales];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.invoice.toLowerCase().includes(term) ||
        sale.items.toString().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [salesData.sales, searchTerm, statusFilter]);

  const handleDelete = async (saleId: string) => {
    try {
      localDB.delete('sales', saleId);
      toast.success('Sale deleted successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete sale');
      console.error(error);
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedInvoice(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleCopyInvoice = async () => {
    if (selectedInvoice) {
      await navigator.clipboard.writeText(selectedInvoice.invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (selectedInvoice) {
      try {
        await navigator.share({
          title: `Invoice ${selectedInvoice.invoice}`,
          text: `Purchase details for invoice ${selectedInvoice.invoice}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Sharing not supported');
      }
    }
  };

  // Sort sales by date
  const sortedSales = [...salesData.sales].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Updated category distribution calculation with proper type safety
  const categoryDistribution = salesData.sales.reduce((acc: Record<string, number>, sale) => {
    if (sale.products) {
      sale.products.forEach((p: SaleProduct) => {
        const category = p.category || 'Other';
        acc[category] = (acc[category] || 0) + p.price;
      });
    }
    return acc;
  }, {});

  // Sort categories by value for better visualization
  const pieData = Object.entries(categoryDistribution)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / Object.values(categoryDistribution).reduce((a, b) => a + b, 0)) * 100)
    }));

  // Add loading state for refresh functionality
  const [isLoading, setIsLoading] = useState(false);

  // Add refresh functionality
  const refreshData = async () => {
    setIsLoading(true);
    try {
      await localDB.recalculateAllTotals();
      window.location.reload();
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvoiceClick = (invoice: string) => {
    const sale = localDB.getAll('sales').find(s => s.invoice_number === invoice);
    if (sale) {
      setSelectedInvoice({
        invoice: sale.invoice_number,
        date: sale.created_at,
        products: sale.products.map(p => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          category: p.category,
        })),
        total: sale.total,
        status: sale.payment_status || 'pending',
        payment_method: sale.payment_method
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header with Refresh Button */}
        <div className="sticky top-0 bg-white border-b z-20 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold">Customer Sales History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className={`p-2 hover:bg-gray-100 rounded-full ${isLoading ? 'animate-spin' : ''}`}
              disabled={isLoading}
            >
              <RefreshCw size={20} className="text-gray-600" />
            </button>
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold">${salesData.total_spent.toLocaleString()}</p>
                </div>
                <DollarSign size={24} className="text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-bold">{salesData.total_purchases}</p>
                </div>
                <ShoppingBag size={24} className="text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Order</p>
                  <p className="text-2xl font-bold">${averageSpent.toLocaleString()}</p>
                </div>
                <TrendingUp size={24} className="text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Last Purchase</p>
                  <p className="text-2xl font-bold">{daysSinceLastPurchase} days ago</p>
                </div>
                <Clock size={24} className="text-purple-500" />
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by invoice or items..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <select 
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
            </div>
          </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-bold mb-4">Purchase History</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedSales}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                    />
                    <Bar dataKey="amount" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-bold mb-4">Spending by Category</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sales Table with Enhanced Header */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="flex flex-col h-[400px]">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold">Purchase Details</h3>
                <p className="text-sm text-gray-500">
                  {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'} found
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((sale) => (
                      <tr 
                        key={sale.id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {format(new Date(sale.date), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(sale.date), 'h:mm a')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                onClick={() => handleInvoiceClick(sale.invoice)}>
                            #{sale.invoice}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{sale.items} items</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ${sale.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`
                            px-2.5 py-1 text-xs font-medium rounded-full
                            ${(sale.status || 'pending') === 'paid' 
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }
                          `}>
                            {(sale.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleInvoiceClick(sale.invoice)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(sale.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this sale? This action cannot be undone.
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
                    if (showDeleteConfirm) {
                      handleDelete(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keep existing invoice details modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl my-4 md:my-8 shadow-xl relative max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
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
                    className="p-2 hover:bg-gray-100 rounded-full tooltip"
                    data-tip={copied ? 'Copied!' : 'Copy Invoice'}
                  >
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Share2 size={20} />
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
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
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
              <div className="border rounded-lg overflow-hidden">
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
                      <tr key={index} className="hover:bg-gray-50">
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

              {/* Add payment method if available */}
              {selectedInvoice.payment_method && (
                <div className="mt-4 text-sm text-gray-500">
                  Payment Method: {selectedInvoice.payment_method}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 flex justify-end gap-3">
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

              {/* Transaction Timeline */}
              <div className="mt-6 max-h-[400px] overflow-y-auto pr-2">
                <TransactionTimeline 
                  customerId={customerId} 
                  onInvoiceClick={handleInvoiceClick}
                />

                {/* Related Purchases */}
                <RelatedPurchases 
                  currentInvoice={selectedInvoice.invoice}
                  customerId={customerId}
                  onInvoiceClick={handleInvoiceClick}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 