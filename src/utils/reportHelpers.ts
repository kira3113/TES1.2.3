import { localDB } from '../lib/localStorage';

export interface Sale {
  id: string;
  customer_id: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export const reportHelpers = {
  getSalesByDateRange(start: Date, end: Date) {
    const sales = localDB.getAll('sales') as Sale[];
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= start && saleDate <= end;
    });
  },

  getDailySales(start: Date, end: Date) {
    const sales = this.getSalesByDateRange(start, end);
    const dailyMap = new Map<string, { sales: number; orders: number }>();

    sales.forEach(sale => {
      const date = sale.created_at.split('T')[0];
      const current = dailyMap.get(date) || { sales: 0, orders: 0 };
      dailyMap.set(date, {
        sales: current.sales + sale.total,
        orders: current.orders + 1
      });
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));
  },

  getCategoryPerformance() {
    const products = localDB.getAll('products') as Product[] || [];
    const sales = localDB.getAll('sales') as Sale[] || [];
    
    const categoryMap = new Map<string, { sales: number; items: number }>();

    // Initialize with all categories having 0 values
    products.forEach(product => {
      const current = categoryMap.get(product.category) || { sales: 0, items: 0 };
      categoryMap.set(product.category, {
        ...current,
        items: current.items + 1
      });
    });

    // Add sales data safely
    sales.forEach(sale => {
      sale.products?.forEach(item => {  // Add optional chaining
        const product = products.find(p => p.id === item.id);
        if (product) {
          const current = categoryMap.get(product.category) || { sales: 0, items: 0 };
          categoryMap.set(product.category, {
            ...current,
            sales: current.sales + (item.quantity * (item.price || 0))
          });
        }
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data
      }))
      .sort((a, b) => (b.sales || 0) - (a.sales || 0));
  },

  getTopProducts() {
    const products = localDB.getAll('products') as Product[] || [];
    const sales = localDB.getAll('sales') as Sale[] || [];
    
    const productSales = new Map<string, { revenue: number; quantity: number }>();

    // Initialize all products with 0 sales
    products.forEach(product => {
      productSales.set(product.id, { revenue: 0, quantity: 0 });
    });

    // Calculate sales safely
    sales.forEach(sale => {
      sale.products?.forEach(item => {
        if (item?.id) {  // Check if item and item.id exist
          const current = productSales.get(item.id);
          if (current) {
            const product = products.find(p => p.id === item.id);
            if (product) {
              productSales.set(item.id, {
                revenue: current.revenue + (item.quantity * (product.price || 0)),
                quantity: current.quantity + (item.quantity || 0)
              });
            }
          }
        }
      });
    });

    return products
      .map(product => ({
        ...product,
        sales: productSales.get(product.id) || { revenue: 0, quantity: 0 }
      }))
      .sort((a, b) => (b.sales?.revenue || 0) - (a.sales?.revenue || 0));
  },

  getCustomerStats(start: Date, end: Date) {
    const sales = this.getSalesByDateRange(start, end);
    const customers = localDB.getAll('customers');
    
    const customerSales = new Map<string, { orders: number; total: number }>();
    
    sales.forEach(sale => {
      const customerId = sale.customer_id;
      const current = customerSales.get(customerId) || { orders: 0, total: 0 };
      customerSales.set(customerId, {
        orders: current.orders + 1,
        total: current.total + sale.total
      });
    });

    const periodStart = new Date(start);
    periodStart.setMonth(periodStart.getMonth() - 1);
    const previousSales = this.getSalesByDateRange(periodStart, start);
    const repeatCustomers = new Set(
      sales.map(s => s.customer_id)
        .filter(id => previousSales.some(ps => ps.customer_id === id))
    ).size;

    return {
      newCustomers: customers.filter(c => 
        new Date(c.created_at) >= start && new Date(c.created_at) <= end
      ).length,
      repeatCustomers,
      averageOrderValue: sales.length ? 
        sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      customerRetentionRate: previousSales.length ? 
        (repeatCustomers / previousSales.length) * 100 : 0
    };
  },

  getCustomerList(start: Date, end: Date) {
    const sales = this.getSalesByDateRange(start, end);
    const customers = localDB.getAll('customers');
    
    const customerStats = new Map<string, { orderCount: number; totalPurchases: number }>();
    
    sales.forEach(sale => {
      const customerId = sale.customer_id;
      const current = customerStats.get(customerId) || { orderCount: 0, totalPurchases: 0 };
      customerStats.set(customerId, {
        orderCount: current.orderCount + 1,
        totalPurchases: current.totalPurchases + sale.total
      });
    });

    return customers
      .map(customer => ({
        ...customer,
        stats: customerStats.get(customer.id) || { orderCount: 0, totalPurchases: 0 }
      }))
      .sort((a, b) => b.stats.totalPurchases - a.stats.totalPurchases);
  },

  getInventoryStats() {
    const products = localDB.getAll('products') as Product[];
    const lowStockThreshold = 30; // You might want to make this configurable
    
    return {
      lowStock: products.filter(p => p.stock <= lowStockThreshold),
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      categoryDistribution: this.getCategoryPerformance()
    };
  }
}; 