import { parseISO } from 'date-fns';
import { localDB } from '../lib/localStorage';
import { Sale, ReportData } from '../types';

export function generateReport(dateRange: { start: string; end: string }): ReportData {
  const sales = localDB.getAll('sales') || [];
  
  const filtered = sales.filter((sale: Sale) => {
    if (!sale?.created_at) return false;
    const saleDate = parseISO(sale.created_at);
    return saleDate >= parseISO(dateRange.start) && saleDate <= parseISO(dateRange.end);
  });

  return {
    dailySales: [], 
    productSales: [], 
    invoiceStatus: [], 
    invoiceAging: [], 
    outstandingInvoices: filtered.filter((sale: Sale) => sale.invoice_status !== 'paid')
  };
} 