export const mockProducts = [
  { id: 'P1', name: 'Laptop Pro X', category: 'Electronics', price: 1299.99, stock: 45 },
  { id: 'P2', name: 'Wireless Earbuds', category: 'Electronics', price: 159.99, stock: 120 },
  { id: 'P3', name: 'Coffee Maker', category: 'Appliances', price: 79.99, stock: 30 },
  { id: 'P4', name: 'Running Shoes', category: 'Sports', price: 89.99, stock: 75 },
  { id: 'P5', name: 'Backpack', category: 'Accessories', price: 49.99, stock: 100 },
  { id: 'P6', name: 'Smart Watch', category: 'Electronics', price: 299.99, stock: 60 },
  { id: 'P7', name: 'Gaming Mouse', category: 'Electronics', price: 59.99, stock: 90 },
  { id: 'P8', name: 'Desk Chair', category: 'Furniture', price: 199.99, stock: 25 },
  { id: 'P9', name: 'Water Bottle', category: 'Sports', price: 24.99, stock: 150 },
  { id: 'P10', name: 'Headphones', category: 'Electronics', price: 199.99, stock: 80 }
];

export const mockSales = mockProducts.map(product => ({
  date: '2024-01',
  product: product.name,
  quantity: Math.floor(Math.random() * 50) + 1,
  revenue: Math.floor(Math.random() * 10000),
  profit: Math.floor(Math.random() * 5000)
}));

export const mockCategories = [
  { category: 'Electronics', sales: 45000, items: 5 },
  { category: 'Sports', sales: 25000, items: 2 },
  { category: 'Appliances', sales: 15000, items: 1 },
  { category: 'Furniture', sales: 10000, items: 1 },
  { category: 'Accessories', sales: 5000, items: 1 }
];

export const mockInventoryAlerts = [
  { id: 'P8', name: 'Desk Chair', stock: 25, threshold: 30, status: 'low' },
  { id: 'P3', name: 'Coffee Maker', stock: 30, threshold: 35, status: 'low' },
  { id: 'P1', name: 'Laptop Pro X', stock: 45, threshold: 50, status: 'warning' }
];

export const mockDailySales = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
  sales: Math.floor(Math.random() * 5000) + 1000,
  orders: Math.floor(Math.random() * 20) + 5
}));

export const mockCustomers = [
  { id: 'C1', name: 'John Doe', email: 'john@example.com', totalPurchases: 12500, orderCount: 8 },
  { id: 'C2', name: 'Jane Smith', email: 'jane@example.com', totalPurchases: 8900, orderCount: 5 },
  { id: 'C3', name: 'Bob Johnson', email: 'bob@example.com', totalPurchases: 15700, orderCount: 12 },
  { id: 'C4', name: 'Alice Brown', email: 'alice@example.com', totalPurchases: 6300, orderCount: 4 },
  { id: 'C5', name: 'Charlie Wilson', email: 'charlie@example.com', totalPurchases: 21000, orderCount: 15 }
];

export const mockCustomerStats = {
  newCustomers: 12,
  repeatCustomers: 45,
  averageOrderValue: 350,
  customerRetentionRate: 78
}; 