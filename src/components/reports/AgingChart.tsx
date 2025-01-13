import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AgingChartProps {
  data: { age: string; amount: number; }[];
  title: string;
}

export function AgingChart({ data, title }: AgingChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <BarChart width={500} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="age" />
        <YAxis tickFormatter={(value: number) => `$${value.toLocaleString()}`} />
        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
        <Legend />
        <Bar dataKey="amount" fill="#EF4444" name="Outstanding ($)" />
      </BarChart>
    </div>
  );
} 