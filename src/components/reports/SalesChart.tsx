import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SalesChartProps {
  data: { date: string; amount: number; }[];
  title: string;
  height?: number;
}

export function SalesChart({ data, title, height = 300 }: SalesChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <BarChart width={500} height={height} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis 
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip 
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
        />
        <Legend />
        <Bar dataKey="amount" fill="#3B82F6" name="Sales ($)" />
      </BarChart>
    </div>
  );
} 