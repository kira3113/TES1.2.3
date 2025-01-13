import { format, parseISO, differenceInDays } from 'date-fns';
import { Sale, Customer } from '@/types';

interface OutstandingInvoicesTableProps {
  sales: Sale[];
  customers: Record<string, Customer>;
}

export function OutstandingInvoicesTable({ sales, customers }: OutstandingInvoicesTableProps) {
  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'overdue' || (dueDate && differenceInDays(new Date(), parseISO(dueDate)) > 0)) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="col-span-2 bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Outstanding Invoices</h2>
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export PDF
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Overdue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale, index) => {
              const daysOverdue = sale.payment_due_date ? 
                differenceInDays(new Date(), parseISO(sale.payment_due_date)) : 0;
              
              return (
                <tr key={index} className={daysOverdue > 0 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customers[sale.customer_id]?.name || sale.customer_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customers[sale.customer_id]?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sale.created_at ? format(parseISO(sale.created_at), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sale.payment_due_date ? format(parseISO(sale.payment_due_date), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${sale.final_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {daysOverdue > 0 ? (
                      <span className="text-red-600 font-medium">{daysOverdue} days</span>
                    ) : 'Not overdue'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${getStatusColor(sale.invoice_status || 'unknown', sale.payment_due_date)}`}>
                      {(sale.invoice_status || 'unknown').toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 