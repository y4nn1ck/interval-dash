import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HydrationData {
  date: string;
  hydration: number | null;
}

interface HydrationChartProps {
  data: HydrationData[];
  selectedPeriod: string;
}

const HydrationChart = ({ data, selectedPeriod }: HydrationChartProps) => {
  const formatXAxisLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    switch (selectedPeriod) {
      case '7days':
        return format(date, 'EEE', { locale: fr });
      case '1month':
        return format(date, 'dd/MM');
      default:
        return format(date, 'dd/MM');
    }
  };

  const hydrationConfig = {
    hydration: {
      label: 'Hydratation (1-5)',
      color: '#06b6d4',
    },
  };

  // Filter out null values for display but keep the structure
  const chartData = data.map(item => ({
    ...item,
    hydration: item.hydration || undefined
  }));

  // Get only items with valid hydration for the chart
  const validData = chartData.filter(item => item.hydration !== undefined && item.hydration !== null);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
        <p>Aucune donnée d'hydratation disponible pour cette période</p>
      </div>
    );
  }

  return (
    <ChartContainer config={hydrationConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="hydrationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={1} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            className="text-gray-600"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            className="text-gray-600"
            domain={[0, 5]}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip 
            content={<ChartTooltipContent className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl" />}
            labelFormatter={(value) => {
              const date = parseISO(value as string);
              return format(date, 'dd MMMM yyyy', { locale: fr });
            }}
          />
          <Bar 
            dataKey="hydration" 
            fill="url(#hydrationGradient)"
            name="Hydratation (1-5)"
            radius={[6, 6, 0, 0]}
            stroke="#06b6d4"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default HydrationChart;
