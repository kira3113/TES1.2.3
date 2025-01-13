import { useState, useEffect } from 'react';
import { Pencil, Trash2, Phone, Mail, History, Search, Plus, Users, X, RefreshCw } from 'lucide-react';
import { localDB } from '../lib/localStorage';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CustomerSalesHistory } from '../components/CustomerSalesHistory';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_purchases: number;
  total_spent: number;
  created_at: string;
}

function CustomerSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-28"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-20"></div>
          <div className="h-5 bg-gray-200 rounded w-24"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </td>
    </tr>
  );
}

function Customers() {
  const { session } = useAuth();
  const { hasPermission } = usePermissions(session?.roleId || '');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'purchases' | 'spent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    // Force recalculation when component mounts
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await localDB.recalculateAllTotals();
        const data = localDB.getAll('customers');
        setCustomers(data || []);
      } catch (error) {
        console.error('Error loading customers:', error);
        toast.error('Error loading customers');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    // Set up interval to check for updates
    const intervalId = setInterval(async () => {
      await localDB.recalculateAllTotals();
      const updatedData = localDB.getAll('customers');
      setCustomers(updatedData || []);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // Initialize storage if needed
      if (!localStorage.getItem('customers')) {
        localDB.set('customers', [{
          id: 'walk-in',
          name: 'Walk-in Customer',
          email: null,
          phone: null,
          total_purchases: 0,
          total_spent: 0,
          created_at: new Date().toISOString()
        }]);
      }
      
      if (!localStorage.getItem('sales')) {
        localDB.set('sales', []);
      }
      
      if (!localStorage.getItem('customer_sales')) {
        localDB.set('customer_sales', {});
      }

      console.log('Before recalculation:', localDB.getAll('customers'));
      
      localDB.recalculateAllTotals();
      
      const data = localDB.getAll('customers');
      console.log('After recalculation:', data);
      
      setCustomers(data || []);
    } catch (error) {
      console.error('Error details:', error);
      toast.error('Error loading customers');
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'total_purchases' | 'total_spent'>) => {
    try {
      // Add customer to database
      localDB.insert('customers', {
        ...customerData,
        total_purchases: 0,
        total_spent: 0
      });
      
      // Recalculate totals and reload
      await localDB.recalculateAllTotals();
      const updatedCustomers = localDB.getAll('customers');
      setCustomers(updatedCustomers);
      
      toast.success('Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Error adding customer');
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      localDB.update('customers', id, customerData);
      
      // Recalculate totals after updating
      await localDB.recalculateAllTotals();
      
      // Reload all customers to get updated totals
      const updatedCustomers = localDB.getAll('customers');
      setCustomers(updatedCustomers);
      
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Error updating customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      // Check if customer has sales before deletion
      const customerSales = localDB.get('customer_sales')?.[id];
      if (customerSales?.total_purchases > 0) {
        toast.error('Cannot delete customer with sales history');
        return;
      }

      localDB.delete('customers', id);
      
      // Recalculate totals after deletion
      await localDB.recalculateAllTotals();
      
      // Reload all customers to get updated totals
      const updatedCustomers = localDB.getAll('customers');
      setCustomers(updatedCustomers);
      
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error deleting customer');
    }
  };

  // Add a refresh function to manually update data
  const refreshCustomers = async () => {
    setIsLoading(true);
    try {
      await localDB.recalculateAllTotals();
      const updatedCustomers = localDB.getAll('customers');
      setCustomers(updatedCustomers);
    } catch (error) {
      console.error('Error refreshing customers:', error);
      toast.error('Error refreshing data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedCustomers = customers
    .filter(customer => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'purchases':
          return order * (a.total_purchases - b.total_purchases);
        case 'spent':
          return order * (a.total_spent - b.total_spent);
        default:
          return 0;
      }
    });

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-blue-500" />
            Customers
          </h1>
          <p className="text-gray-500 mt-1">Manage your customer relationships</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshCustomers}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </motion.button>
          {hasPermission('manage_customers') && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              Add Customer
            </motion.button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-gray-500 text-sm">Total Customers</div>
          <div className="text-2xl font-bold mt-1">{customers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-gray-500 text-sm">Total Sales</div>
          <div className="text-2xl font-bold mt-1">
            ${customers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-gray-500 text-sm">Average Purchase Value</div>
          <div className="text-2xl font-bold mt-1">
            ${(customers.reduce((sum, c) => sum + c.total_spent, 0) / 
               Math.max(customers.reduce((sum, c) => sum + c.total_purchases, 0), 1)
              ).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="name">Sort by Name</option>
            <option value="purchases">Sort by Purchases</option>
            <option value="spent">Sort by Total Spent</option>
          </select>
          <button
            onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <CustomerSkeleton key={i} />)
              ) : (
                filteredAndSortedCustomers.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      {customer.id === 'walk-in' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Walk-in
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {customer.phone && (
                          <a
                            href={`tel:${customer.phone}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                          >
                            <Phone size={14} />
                            {customer.phone}
                          </a>
                        )}
                        {customer.email && (
                          <a
                            href={`mailto:${customer.email}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                          >
                            <Mail size={14} />
                            {customer.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer.total_purchases} orders
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ${customer.total_spent?.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(customer.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedCustomer(customer.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                          title="View Sales History"
                        >
                          <History size={18} />
                        </motion.button>
                        {hasPermission('manage_customers') && customer.id !== 'walk-in' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingCustomer(customer)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              title="Edit Customer"
                            >
                              <Pencil size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
                                  deleteCustomer(customer.id);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                              title="Delete Customer"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || editingCustomer) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const customerData = {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string || null,
                  phone: formData.get('phone') as string || null,
                };

                if (editingCustomer) {
                  updateCustomer(editingCustomer.id, customerData);
                  setEditingCustomer(null);
                } else {
                  addCustomer(customerData);
                  setIsAddModalOpen(false);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      defaultValue={editingCustomer?.name}
                      placeholder="Enter customer name"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={editingCustomer?.email || ''}
                      placeholder="customer@example.com"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={editingCustomer?.phone || ''}
                      placeholder="+1 (234) 567-8900"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingCustomer(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    {editingCustomer ? (
                      <>
                        <Pencil size={18} />
                        Update Customer
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Customer
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sales History Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-6 m-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="text-blue-500" />
                  Customer Sales History
                </h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <CustomerSalesHistory customerId={selectedCustomer} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Customers;