
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HydrationData {
  date: string;
  hydration: number | null;
}

interface HydrationChartProps {
  data: HydrationData[];
}

const HydrationChart = ({ data }: HydrationChartProps) => {
  const hydrationConfig = {
    hydration: {
      label: 'Hydratation (1-4)',
      color: '#06b6d4',
    },
  };

  // Get the color for each hydration level
  const getHydrationColor = (value: number) => {
    switch (value) {
      case 1: return '#ef4444'; // red
      case 2: return '#f97316'; // orange
      case 3: return '#22c55e'; // green
      case 4: return '#3b82f6'; // blue
      default: return '#9ca3af'; // gray
    }
  };

  // Only show data that has hydration values
  const validData = data.filter(item => item.hydration !== null && item.hydration !== undefined);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
        <p>Aucune donnée d'hydratation disponible</p>
      </div>
    );
  }

  return (
    <ChartContainer config={hydrationConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={1} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(dateStr) => {
              const date = parseISO(dateStr);
              return format(date, 'EEE', { locale: fr });
            }}
            className="text-gray-600"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            className="text-gray-600"
            domain={[0, 4]}
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
            name="Hydratation (1-4)"
            radius={[6, 6, 0, 0]}
            strokeWidth={1}
          >
            {validData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getHydrationColor(entry.hydration || 0)}
                stroke={getHydrationColor(entry.hydration || 0)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default HydrationChart;
