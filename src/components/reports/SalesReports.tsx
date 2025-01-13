import { reportHelpers } from '../../utils/reportHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface SalesReportsProps {
  dateRange: { start: Date; end: Date };
}

export function SalesReports({ dateRange }: SalesReportsProps) {
  const dailySales = reportHelpers.getDailySales(dateRange.start, dateRange.end);
  const topProducts = reportHelpers.getTopProducts();
  const categoryData = reportHelpers.getCategoryPerformance();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Daily Sales</h2>
        <BarChart width={800} height={300} data={dailySales}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="sales" fill="#3B82F6" name="Sales ($)" />
          <Bar dataKey="orders" fill="#10B981" name="Orders" />
        </BarChart>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Top Products</h3>
          <div className="space-y-4">
            {topProducts.slice(0, 5).map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">
                    ${product.sales.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.sales.quantity} units
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Sales by Category</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={categoryData}
              dataKey="sales"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280']; 