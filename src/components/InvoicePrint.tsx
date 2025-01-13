import { format } from 'date-fns';

interface Sale {
  id: string;
  customer_id: string;
  customer_name: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  created_at: string;
  payment_status: 'paid' | 'pending';
  invoice_number: string;
}

export function InvoicePrint({ sale }: { sale: Sale }) {
  if (!sale) {
    return <div>No invoice data available</div>;
  }

  return (
    <div className="p-8 bg-white" id="invoice-print">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">INVOICE</h1>
        <p>Date: {format(new Date(sale.created_at), 'MMM d, yyyy h:mm a')}</p>
        <p>Invoice #: {sale.id?.slice(0, 8) || 'N/A'}</p>
      </div>

      <div className="mb-8">
        <h2 className="font-bold mb-2">Customer Details:</h2>
        <p>{sale.customer_name || 'Walk-in Customer'}</p>
      </div>

      <div className="mb-8">
        {Array.isArray(sale.products) && sale.products.length > 0 ? (
          sale.products.map(item => (
            <div key={item.id} className="flex justify-between py-2 border-b">
              <span>{item.name} x {item.quantity}</span>
              <span>
                @ ${item.price?.toFixed(2)} = ${(item.quantity * item.price)?.toFixed(2)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No products in this invoice</div>
        )}
      </div>

      <div className="text-right text-xl font-bold mb-8">
        Total: ${(sale.total || 0).toFixed(2)}
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
} 