import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SleepData {
  date: string;
  sleep_hours: number | null;
}

interface SleepChartProps {
  data: SleepData[];
}

const SleepChart = ({ data }: SleepChartProps) => {
  const sleepConfig = {
    sleep_hours: {
      label: 'Sommeil (heures)',
      color: '#8b5cf6',
    },
  };

  const getSleepColor = (hours: number) => {
    if (hours >= 8) return '#10b981';
    if (hours >= 7) return '#3b82f6';
    if (hours >= 6) return '#f59e0b';
    return '#ef4444';
  };

  const getGradientId = (hours: number) => {
    if (hours >= 8) return 'sleepGradient1';
    if (hours >= 7) return 'sleepGradient2';
    if (hours >= 6) return 'sleepGradient3';
    return 'sleepGradient4';
  };

  const getSleepLabel = (hours: number) => {
    if (hours >= 8) return 'Excellent';
    if (hours >= 7) return 'Bon';
    if (hours >= 6) return 'Moyen';
    return 'Insuffisant';
  };

  const validData = data.filter(item => item.sleep_hours !== null && item.sleep_hours !== undefined);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p>Aucune donnée de sommeil disponible</p>
      </div>
    );
  }

  return (
    <ChartContainer config={sleepConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="sleepGradient1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="sleepGradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="sleepGradient3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="sleepGradient4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
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
            domain={[0, 10]}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}h`}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              className="bg-card/95 backdrop-blur-xl border-border shadow-xl"
              formatter={(value) => [`${Math.round(value as number)}h (${getSleepLabel(value as number)})`, 'Sommeil']}
            />}
            labelFormatter={(value) => {
              const date = parseISO(value as string);
              return format(date, 'dd MMMM yyyy', { locale: fr });
            }}
          />
          <Bar 
            dataKey="sleep_hours" 
            name="Sommeil"
            radius={[6, 6, 0, 0]}
            strokeWidth={1}
          >
            {validData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#${getGradientId(entry.sleep_hours || 0)})`}
                stroke={getSleepColor(entry.sleep_hours || 0)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default SleepChart;
