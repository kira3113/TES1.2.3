import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ProductChartProps {
  data: { product: string; amount: number; }[];
  title: string;
}

export function ProductChart({ data, title }: ProductChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <BarChart width={500} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="product" />
        <YAxis tickFormatter={(value: number) => `$${value.toLocaleString()}`} />
        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
        <Legend />
        <Bar dataKey="amount" fill="#10B981" name="Revenue ($)" />
      </BarChart>
    </div>
  );
} 