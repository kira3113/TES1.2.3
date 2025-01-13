export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  purchase_price: number;
  current_stock: number;
  min_stock_level: number;
  category: string;
  total_sold?: number;
  revenue?: number;
  created_at?: string;
} 