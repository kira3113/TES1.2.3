import { reportHelpers } from '../../utils/reportHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface CustomerReportsProps {
  dateRange: { start: Date; end: Date };
}

export function CustomerReports({ dateRange }: CustomerReportsProps) {
  const stats = reportHelpers.getCustomerStats(dateRange.start, dateRange.end);
  const customers = reportHelpers.getCustomerList(dateRange.start, dateRange.end);
  const dailyOrders = reportHelpers.getDailySales(dateRange.start, dateRange.end);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'New Customers', value: stats.newCustomers },
          { label: 'Repeat Customers', value: stats.repeatCustomers },
          { label: 'Average Order Value', value: stats.averageOrderValue, format: 'currency' },
          { label: 'Retention Rate', value: stats.customerRetentionRate, format: 'percent' }
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {stat.format === 'currency' ? `$${stat.value.toFixed(2)}` : 
               stat.format === 'percent' ? `${stat.value.toFixed(1)}%` : 
               stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Customer Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.stats.orderCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.stats.totalPurchases.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Daily Orders</h3>
        <BarChart width={800} height={300} data={dailyOrders}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
        </BarChart>
      </div>
    </div>
  );
} 