import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, MinusIcon } from 'lucide-react';

interface InvoiceStatusPieChartProps {
  data: Array<{
    status: 'paid' | 'pending' | 'overdue';
    value: number;
    count: number;
  }>;
}

export function InvoiceStatusPieChart({ data }: InvoiceStatusPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const COLORS = {
    paid: '#10B981',
    pending: '#F59E0B',
    overdue: '#EF4444'
  };

  const TRENDS = {
    paid: { icon: ArrowUpRight, color: 'text-green-500' },
    pending: { icon: MinusIcon, color: 'text-yellow-500' },
    overdue: { icon: ArrowDownRight, color: 'text-red-500' }
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const isActive = activeIndex === index;

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
      >
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          style={{
            fontSize: isActive ? '14px' : '12px',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </motion.g>
    );
  };

  const formatStatus = (status: string) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTrend = (status: 'paid' | 'pending' | 'overdue') => {
    const Icon = TRENDS[status].icon;
    return (
      <span className={`inline-flex items-center ${TRENDS[status].color}`}>
        <Icon size={16} className="ml-1" />
      </span>
    );
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const getPercentage = (count: number) => ((count / total) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300"
    >
      <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
        <span>Invoice Status Distribution</span>
        <span className="text-sm font-normal text-gray-500">
          Total: {total} transactions
        </span>
      </h2>
      <div className="flex flex-col items-center">
        <div className="relative">
          <PieChart width={400} height={300}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="status"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.status}`}
                  fill={COLORS[entry.status]}
                  opacity={hoveredStatus === entry.status ? 0.8 : 1}
                  className="transition-opacity duration-300"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white shadow-lg rounded-lg p-3 border"
                  >
                    <p className="font-medium text-gray-800">
                      {formatStatus(data.status)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.count} transactions ({getPercentage(data.count)}%)
                    </p>
                  </motion.div>
                );
              }}
            />
            <Legend
              formatter={(value: string) => formatStatus(value)}
              onClick={(data) => setHoveredStatus(data.value)}
              onMouseEnter={(data) => setHoveredStatus(data.value)}
              onMouseLeave={() => setHoveredStatus(null)}
            />
          </PieChart>
        </div>

        <motion.div 
          className="grid grid-cols-3 gap-4 mt-4 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {data.map((item) => (
            <motion.div
              key={item.status}
              className={`px-4 py-3 rounded-lg cursor-pointer transform transition-all duration-300
                ${hoveredStatus === item.status ? 'scale-105 shadow-md' : 'hover:scale-102'}`}
              style={{ 
                backgroundColor: `${COLORS[item.status]}15`,
                borderLeft: `4px solid ${COLORS[item.status]}`
              }}
              whileHover={{ y: -2 }}
              onHoverStart={() => setHoveredStatus(item.status)}
              onHoverEnd={() => setHoveredStatus(null)}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: COLORS[item.status] }}>
                  {formatStatus(item.status)}
                  {getTrend(item.status)}
                </p>
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS[item.status] }}>
                {item.count}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getPercentage(item.count)}% of total
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
} 