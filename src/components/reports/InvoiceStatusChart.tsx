import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface InvoiceStatusChartProps {
  data: { status: string; amount: number; }[];
}

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  const COLORS = {
    paid: '#10B981',
    pending: '#F59E0B',
    overdue: '#EF4444',
    unknown: '#6B7280'
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">Invoice Status</h2>
      <PieChart width={500} height={300}>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="status"
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[entry.status as keyof typeof COLORS] || COLORS.unknown} 
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
        <Legend />
      </PieChart>
    </div>
  );
} 