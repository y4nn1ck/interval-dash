
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RestingHRData {
  date: string;
  resting_hr: number;
}

interface RestingHRChartProps {
  data: RestingHRData[];
}

const RestingHRChart = ({ data }: RestingHRChartProps) => {
  const chartConfig = {
    resting_hr: {
      label: 'FC Repos (bpm)',
      color: '#ef4444',
    },
  };

  // Filter out data with zero or null values
  const validData = data.filter(item => item.resting_hr && item.resting_hr > 0);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p>Aucune donnée de fréquence cardiaque disponible</p>
      </div>
    );
  }

  // Calculate average resting heart rate
  const averageRestingHR = validData.reduce((sum, item) => sum + item.resting_hr, 0) / validData.length;

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="restingHRGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(dateStr) => {
              const date = parseISO(dateStr);
              return format(date, 'EEE', { locale: fr });
            }}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 5', 'dataMax + 5']}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              className="bg-card/95 backdrop-blur-xl border-border shadow-xl"
              formatter={(value) => [`${value} bpm`, 'FC Repos']}
            />}
            labelFormatter={(value) => {
              const date = parseISO(value as string);
              return format(date, 'dd MMMM yyyy', { locale: fr });
            }}
          />
          <ReferenceLine 
            y={averageRestingHR} 
            stroke="#3b82f6" 
            strokeWidth={1}
            strokeDasharray="5 5"
            label={{ value: `Moyenne: ${Math.round(averageRestingHR)} bpm`, position: "top", fontSize: 11, fill: "#3b82f6" }}
          />
          <Line 
            type="monotone" 
            dataKey="resting_hr" 
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2 }}
            fill="url(#restingHRGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default RestingHRChart;
