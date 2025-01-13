import { useMemo } from 'react';
import { localDB } from '../lib/localStorage';
import { 
  DollarSign, 
  ShoppingBag, 
  Edit2, 
  Package, 
  AlertTriangle, 
  Activity,
  Save,
  History,
  Users,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface SaleProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface DashboardSale {
  id: string;
  products: SaleProduct[];
  customer_name: string;
  total: number;
  created_at: string;
}

interface DashboardProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  current_stock: number;
  min_stock_level: number;
  sku: string;
  category: string;
}

interface StockAlert {
  product: string;
  current: number;
  minimum: number;
  sku: string;
  category: string;
}

interface DashboardCustomer {
  id: string;
  name: string;
  total_spent: number;
  total_purchases: number;
}

interface DashboardMetrics {
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockProducts: number;
  stockAlerts: StockAlert[];
  recentSales: DashboardSale[];
  topProducts: DashboardProduct[];
  topCustomers: DashboardCustomer[];
}

function Dashboard() {
  const { session } = useAuth();
  const { hasPermission } = usePermissions(session?.roleId || '');

  const metrics: DashboardMetrics = useMemo(() => {
    const products = localDB.getAll('products') || [];
    const sales = localDB.getAll('sales') || [];
    const customers = localDB.getAll('customers') || [];
    
    // Calculate stock alerts
    const stockAlerts = products
      .filter(product => product && product.current_stock <= product.min_stock_level)
      .map(product => ({
        product: product.name,
        current: product.current_stock,
        minimum: product.min_stock_level,
        sku: product.sku,
        category: product.category
      }));

    // Calculate recent sales
    const recentSales = [...(sales || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Calculate top products
    const productSales = new Map<string, DashboardProduct>();
    
    products.forEach(product => {
      if (product) {
        productSales.set(product.id, {
          ...product,
          totalSold: 0,
          revenue: 0
        });
      }
    });

    sales.forEach(sale => {
      if (sale && Array.isArray(sale.products)) {
        sale.products.forEach((item: SaleProduct) => {
          if (item && item.id) {
            const product = productSales.get(item.id);
            if (product) {
              product.totalSold += item.quantity || 0;
              product.revenue += (item.price * item.quantity) || 0;
            }
          }
        });
      }
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate top customers
    const topCustomers = customers
      .filter(c => c.id !== 'walk-in')
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        total_spent: c.total_spent || 0,
        total_purchases: c.total_purchases || 0
      }));

    return {
      totalSales: sales.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      totalRevenue: sales.reduce((sum, sale) => sum + (sale?.total || 0), 0),
      lowStockProducts: stockAlerts.length,
      stockAlerts,
      recentSales,
      topProducts,
      topCustomers
    };
  }, []); // Empty dependency array since we're reading from localStorage

  const handleEditClick = (product: { product: string }) => {
    window.location.href = `/products?edit=${product.product}`;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${metrics.totalRevenue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingBag className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold">{metrics.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Package className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold">{metrics.lowStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Sales</h2>
              <p className="text-sm text-gray-500">Latest transactions</p>
            </div>
            <Link 
              to="/sales" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {metrics.recentSales.map((sale) => (
              <div key={`sale-${sale.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <ShoppingBag size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.customer_name || 'Unknown Customer'}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(sale.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${(sale.total || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{sale.products?.length || 0} item{sale.products?.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
              <p className="text-sm text-gray-500">Best selling items</p>
            </div>
            <Link 
              to="/products" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {metrics.topProducts.map((product, index) => (
              <div key={`product-${product.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        index === 0 ? 'bg-blue-100 text-blue-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index === 0 ? '🏆 Best Seller' :
                         index === 1 ? '🥈 Runner Up' :
                         index === 2 ? '🥉 Third Place' : 
                         `Rank ${index + 1}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${(product.revenue || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Top Customers</h2>
              <p className="text-sm text-gray-500">Most valuable clients</p>
            </div>
            <Link 
              to="/customers" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {metrics.topCustomers.map((customer, index) => (
              <div key={`customer-${customer.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {index === 0 ? '👑' :
                     index === 1 ? '⭐' :
                     index === 2 ? '🌟' : 
                     '🎯'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">
                      Total Spent: ${(customer.total_spent || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    Rank #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Alerts Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Stock Alerts</h2>
            <p className="text-sm text-gray-500">Products that need attention</p>
          </div>
          {metrics.stockAlerts.length > 0 && (
            <Link 
              to="/products" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {metrics.stockAlerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <h3 className="text-sm font-medium text-gray-900">All Stock Levels are Healthy</h3>
            <p className="text-sm text-gray-500 mt-1">No products require attention</p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.stockAlerts.map(product => (
              <div key={`alert-${product.sku}`} className="flex items-center justify-between p-4 rounded-lg border border-l-4 hover:bg-gray-50 transition-colors" style={{
                borderLeftColor: product.current === 0 ? '#EF4444' : '#F59E0B'
              }}>
                <div className="flex items-center gap-4">
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center ${
                    product.current === 0 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {product.current === 0 ? (
                      <XCircle size={20} />
                    ) : (
                      <AlertTriangle size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{product.product}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        Category: {product.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Current Stock</div>
                    <div className={`font-medium ${
                      product.current === 0 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {product.current} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Minimum Required</div>
                    <div className="font-medium text-gray-900">
                      {product.minimum} units
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditClick(product)}
                    className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {metrics.stockAlerts.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t mt-6">
                <p className="text-sm text-gray-500">
                  {metrics.stockAlerts.length} product{metrics.stockAlerts.length !== 1 ? 's' : ''} need attention
                </p>
                <button
                  onClick={() => window.location.href = '/products'}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Manage Inventory →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500">System Health</p>
              <p className="text-2xl font-bold">Healthy</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Save className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500">Quick Backup</p>
              <p className="text-2xl font-bold">Not Backed Up</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <History className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500">Last Backup Status</p>
              <p className="text-2xl font-bold">Not Backed Up</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitive sections */}
      {hasPermission('view_reports') && (
        <div className="analytics">
          {/* Advanced analytics */}
        </div>
      )}

      {hasPermission('manage_settings') && (
        <div className="system-health">
          {/* System health monitoring */}
        </div>
      )}
    </div>
  );
}

export default Dashboard;