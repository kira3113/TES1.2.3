import { useMemo } from 'react';
import { useReportData } from '../../hooks/useReportData';

interface SummaryCardsProps {
  dateRange: { start: Date; end: Date };
}

export function SummaryCards({ dateRange }: SummaryCardsProps) {
  const { data, isLoading } = useReportData(dateRange);

  const metrics = useMemo(() => [
    {
      label: 'Total Sales',
      value: data?.totalSales || 0,
      change: data?.salesChange || 0,
      format: 'currency'
    },
    {
      label: 'Net Profit',
      value: data?.netProfit || 0,
      change: data?.profitChange || 0,
      format: 'currency'
    },
    {
      label: 'Total Orders',
      value: data?.totalOrders || 0,
      change: data?.ordersChange || 0,
      format: 'number'
    },
    {
      label: 'Average Order Value',
      value: data?.averageOrderValue || 0,
      change: data?.aovChange || 0,
      format: 'currency'
    }
  ], [data]);

  if (isLoading) {
    return <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {metrics.map(metric => (
        <div key={metric.label} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {metric.format === 'currency' 
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metric.value)
                : metric.value.toLocaleString()}
            </p>
            <p className={`ml-2 flex items-baseline text-sm font-semibold ${
              metric.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change > 0 ? '↑' : '↓'}
              {Math.abs(metric.change)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 