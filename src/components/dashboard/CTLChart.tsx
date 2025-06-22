
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CTLData {
  date: string;
  ctl: number;
}

interface CTLChartProps {
  data: CTLData[];
}

const CTLChart = ({ data }: CTLChartProps) => {
  const chartConfig = {
    ctl: {
      label: 'CTL (Fitness)',
      color: '#10b981',
    },
  };

  // Filter out data with zero or null values
  const validData = data.filter(item => item.ctl && item.ctl > 0);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
        <p>Aucune donnée de fitness disponible</p>
      </div>
    );
  }

  // Calculate average CTL
  const averageCTL = validData.reduce((sum, item) => sum + item.ctl, 0) / validData.length;

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="ctlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
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
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl"
              formatter={(value) => [`${value}`, 'CTL (Fitness)']}
            />}
            labelFormatter={(value) => {
              const date = parseISO(value as string);
              return format(date, 'dd MMMM yyyy', { locale: fr });
            }}
          />
          <ReferenceLine 
            y={averageCTL} 
            stroke="#3b82f6" 
            strokeWidth={1}
            strokeDasharray="5 5"
            label={{ value: `Moyenne: ${Math.round(averageCTL)}`, position: "top", fontSize: 11, fill: "#3b82f6" }}
          />
          <Line 
            type="monotone" 
            dataKey="ctl" 
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2 }}
            fill="url(#ctlGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default CTLChart;
