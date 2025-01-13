import { useState, useEffect } from 'react';

interface ReportData {
  totalSales: number;
  salesChange: number;
  netProfit: number;
  profitChange: number;
  totalOrders: number;
  ordersChange: number;
  averageOrderValue: number;
  aovChange: number;
}

export function useReportData(dateRange: { start: Date; end: Date }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        setData({
          totalSales: 100000,
          salesChange: 12.5,
          netProfit: 25000,
          profitChange: 8.3,
          totalOrders: 150,
          ordersChange: 5.2,
          averageOrderValue: 666.67,
          aovChange: 2.1
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  return { data, isLoading };
} 