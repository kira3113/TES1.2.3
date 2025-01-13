export interface Sale {
  created_at: string;
  final_amount: number;
  items: { product_name: string; total_price: number; }[];
  customer_id: string;
  invoice_status: 'paid' | 'pending' | 'overdue' | 'unknown';
  payment_due_date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface ReportData {
  dailySales: { date: string; amount: number; }[];
  productSales: { product: string; amount: number; }[];
  invoiceStatus: { status: string; amount: number; }[];
  invoiceAging: { age: string; amount: number; }[];
  outstandingInvoices: Sale[];
} 