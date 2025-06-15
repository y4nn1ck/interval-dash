
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Droplets } from 'lucide-react';

interface HydrationData {
  date: string;
  hydration: number;
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
      label: 'Hydratation (L)',
      color: '#06b6d4',
    },
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 backdrop-blur-sm bg-white/95">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
          <Droplets className="h-6 w-6 text-white" />
        </div>
        <h4 className="text-xl font-semibold text-gray-800">Hydratation quotidienne</h4>
      </div>
      <ChartContainer config={hydrationConfig} className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              name="Hydratation (L)"
              radius={[8, 8, 0, 0]}
              stroke="#06b6d4"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default HydrationChart;
