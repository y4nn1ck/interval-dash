
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

  // Get the color for each hydration level (reversed)
  const getHydrationColor = (value: number) => {
    switch (value) {
      case 1: return '#3b82f6'; // blue for "Bien"
      case 2: return '#22c55e'; // green for "Ok"
      case 3: return '#f97316'; // orange for "Moyen"
      case 4: return '#ef4444'; // red for "Mauvais"
      default: return '#9ca3af'; // gray
    }
  };

  // Get gradient ID for each hydration level
  const getGradientId = (value: number) => {
    switch (value) {
      case 1: return 'hydrationGradient1';
      case 2: return 'hydrationGradient2';
      case 3: return 'hydrationGradient3';
      case 4: return 'hydrationGradient4';
      default: return 'hydrationGradientDefault';
    }
  };

  // Get French label for hydration level
  const getHydrationLabel = (value: number) => {
    switch (value) {
      case 1: return 'Bien';
      case 2: return 'Ok';
      case 3: return 'Moyen';
      case 4: return 'Mauvais';
      default: return 'N/A';
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
          <defs>
            <linearGradient id="hydrationGradient1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="hydrationGradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="hydrationGradient3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="hydrationGradient4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="hydrationGradientDefault" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.3}/>
            </linearGradient>
          </defs>
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
            content={<ChartTooltipContent 
              className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl"
              formatter={(value) => [getHydrationLabel(value as number), 'Hydratation']}
            />}
            labelFormatter={(value) => {
              const date = parseISO(value as string);
              return format(date, 'dd MMMM yyyy', { locale: fr });
            }}
          />
          <Bar 
            dataKey="hydration" 
            name="Hydratation"
            radius={[6, 6, 0, 0]}
            strokeWidth={1}
          >
            {validData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#${getGradientId(entry.hydration || 0)})`}
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
