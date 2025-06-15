
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

interface TrainingStressData {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

const TrainingStressChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  const generateMockData = (period: string): TrainingStressData[] => {
    const endDate = new Date();
    let days = 7;
    
    switch (period) {
      case '7days':
        days = 7;
        break;
      case '1month':
        days = 30;
        break;
      case '1year':
        days = 365;
        break;
    }

    const data: TrainingStressData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      const baseCtl = 65;
      const baseAtl = 52;
      
      // Add some realistic variation
      const ctlVariation = Math.sin(i * 0.1) * 10 + Math.random() * 5;
      const atlVariation = Math.sin(i * 0.15) * 15 + Math.random() * 8;
      
      const ctl = Math.max(30, baseCtl + ctlVariation);
      const atl = Math.max(20, baseAtl + atlVariation);
      const tsb = ctl - atl;

      data.push({
        date: date.toISOString().split('T')[0],
        ctl: Math.round(ctl),
        atl: Math.round(atl),
        tsb: Math.round(tsb)
      });
    }
    
    return data;
  };

  const { data: chartData = [] } = useQuery({
    queryKey: ['training-stress-chart', selectedPeriod],
    queryFn: () => generateMockData(selectedPeriod),
  });

  const formatXAxisLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    switch (selectedPeriod) {
      case '7days':
        return format(date, 'EEE', { locale: fr });
      case '1month':
        return format(date, 'dd/MM');
      case '1year':
        return format(date, 'MMM', { locale: fr });
      default:
        return format(date, 'dd/MM');
    }
  };

  const chartConfig = {
    ctl: {
      label: 'CTL (Fitness)',
      color: '#22c55e',
    },
    atl: {
      label: 'ATL (Fatigue)',
      color: '#f97316',
    },
    tsb: {
      label: 'TSB (Forme)',
      color: '#3b82f6',
    },
  };

  return (
    <div className="space-y-4">
      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="7days">7 jours</TabsTrigger>
          <TabsTrigger value="1month">1 mois</TabsTrigger>
          <TabsTrigger value="1year">1 an</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedPeriod} className="mt-6">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisLabel}
                  className="text-muted-foreground"
                />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => {
                    const date = parseISO(value as string);
                    return format(date, 'dd MMMM yyyy', { locale: fr });
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ctl" 
                  stroke="var(--color-ctl)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="CTL (Fitness)"
                />
                <Line 
                  type="monotone" 
                  dataKey="atl" 
                  stroke="var(--color-atl)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="ATL (Fatigue)"
                />
                <Line 
                  type="monotone" 
                  dataKey="tsb" 
                  stroke="var(--color-tsb)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="TSB (Forme)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingStressChart;
