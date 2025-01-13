import { mockDailySales, mockCategories } from '../../utils/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ProfitLossReportsProps {
  dateRange: { start: Date; end: Date };
}

export function ProfitLossReports({ dateRange }: ProfitLossReportsProps) {
  const filteredData = mockDailySales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= dateRange.start && saleDate <= dateRange.end;
  });

  const totalRevenue = filteredData.reduce((sum, day) => sum + day.sales, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: totalRevenue, format: 'currency' },
          { label: 'Gross Profit', value: totalRevenue * 0.3, format: 'currency' },
          { label: 'Net Profit', value: totalRevenue * 0.15, format: 'currency' },
          { label: 'Profit Margin', value: 15, format: 'percent' }
        ].map(metric => (
          <div key={metric.label} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {metric.format === 'currency' 
                ? `$${metric.value.toLocaleString()}`
                : `${metric.value}%`}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue vs Profit Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Revenue & Profit Trends</h3>
        <LineChart width={800} height={300} data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="sales" stroke="#3B82F6" name="Revenue" />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#10B981" 
            name="Profit"
            strokeDasharray="5 5"
            data={filteredData.map(day => ({ ...day, sales: day.sales * 0.15 }))}
          />
        </LineChart>
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Category Performance</h3>
          <div className="space-y-4">
            {mockCategories.map(category => (
              <div key={category.category} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{category.category}</p>
                  <p className="text-sm text-gray-500">
                    {category.items} products
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">
                    ${category.sales.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">
                    ${(category.sales * 0.15).toLocaleString()} profit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            {[
              { category: 'Operating Costs', amount: totalRevenue * 0.4 },
              { category: 'Marketing', amount: totalRevenue * 0.15 },
              { category: 'Inventory', amount: totalRevenue * 0.2 },
              { category: 'Staff', amount: totalRevenue * 0.1 },
              { category: 'Other', amount: totalRevenue * 0.05 }
            ].map(expense => (
              <div key={expense.category} className="flex items-center justify-between">
                <p className="font-medium">{expense.category}</p>
                <p className="text-gray-900">${expense.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 