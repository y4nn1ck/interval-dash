import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrainingStressData {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

interface CTLATLTSBChartProps {
  data: TrainingStressData[];
  selectedPeriod: string;
}

const CTLATLTSBChart = ({ data, selectedPeriod }: CTLATLTSBChartProps) => {
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

  const chartConfig = {
    ctl: {
      label: 'CTL (Fitness)',
      color: '#10b981',
    },
    atl: {
      label: 'ATL (Fatigue)',
      color: '#f59e0b',
    },
    tsb: {
      label: 'TSB (Forme)',
      color: '#3b82f6',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="ctlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="atlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="tsbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip 
            content={<ChartTooltipContent className="bg-card/95 backdrop-blur-xl border-border shadow-xl" />}
            labelFormatter={(value) => {
              const date = parseISO(value as string);
              return format(date, 'dd MMMM yyyy', { locale: fr });
            }}
          />
          <Line 
            type="monotone" 
            dataKey="ctl" 
            stroke="var(--color-ctl)" 
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--color-ctl)", strokeWidth: 2, stroke: 'hsl(var(--card))' }}
            activeDot={{ r: 6, stroke: "var(--color-ctl)", strokeWidth: 2, fill: 'hsl(var(--card))' }}
            name="CTL (Fitness)"
            fill="url(#ctlGradient)"
          />
          <Line 
            type="monotone" 
            dataKey="atl" 
            stroke="var(--color-atl)" 
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--color-atl)", strokeWidth: 2, stroke: 'hsl(var(--card))' }}
            activeDot={{ r: 6, stroke: "var(--color-atl)", strokeWidth: 2, fill: 'hsl(var(--card))' }}
            name="ATL (Fatigue)"
            fill="url(#atlGradient)"
          />
          <Line 
            type="monotone" 
            dataKey="tsb" 
            stroke="var(--color-tsb)" 
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--color-tsb)", strokeWidth: 2, stroke: 'hsl(var(--card))' }}
            activeDot={{ r: 6, stroke: "var(--color-tsb)", strokeWidth: 2, fill: 'hsl(var(--card))' }}
            name="TSB (Forme)"
            fill="url(#tsbGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default CTLATLTSBChart;
