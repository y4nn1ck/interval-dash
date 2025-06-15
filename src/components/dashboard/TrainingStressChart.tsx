
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { intervalsService } from '@/services/intervalsService';

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
    }

    const data: TrainingStressData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      const baseCtl = 67;
      const baseAtl = 67;
      
      // Add some realistic variation
      const ctlVariation = Math.sin(i * 0.1) * 8 + Math.random() * 3;
      const atlVariation = Math.sin(i * 0.15) * 12 + Math.random() * 5;
      
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
    queryFn: async () => {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      
      if (!apiKey || !athleteId) {
        return generateMockData(selectedPeriod);
      }

      try {
        // Try to fetch real data from the weekly stats
        const weeklyData = await intervalsService.getWeeklyStats();
        if (weeklyData.length > 0) {
          return weeklyData.map(stat => ({
            date: stat.date,
            ctl: Math.round(stat.ctl || 67),
            atl: Math.round(stat.atl || 67),
            tsb: Math.round(stat.tsb || 0)
          }));
        }
      } catch (error) {
        console.error('Error fetching real training stress data:', error);
      }
      
      return generateMockData(selectedPeriod);
    },
  });

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="7days">7 jours</TabsTrigger>
          <TabsTrigger value="1month">1 mois</TabsTrigger>
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
