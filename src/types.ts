export interface SaleProduct {
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface SaleItem {
  product_name: string;
  total_price: number;
}

export interface Sale {
  id: string;
  created_at: string;
  total: number;
  final_amount: number;
  products: SaleProduct[];
  items: SaleItem[];
  invoice_number: string;
  invoice_status: 'paid' | 'pending' | 'overdue' | 'unknown';
  payment_status: 'paid' | 'pending';
  payment_due_date: string;
  customer_id: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
} 