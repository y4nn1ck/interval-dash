import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { intervalsService } from '@/services/intervalsService';
import { TrendingUp, Droplets } from 'lucide-react';

interface TrainingStressData {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

interface HydrationData {
  date: string;
  hydration: number;
}

const TrainingStressChart = () => {
  const [isMonthView, setIsMonthView] = useState(false);
  const selectedPeriod = isMonthView ? '1month' : '7days';

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

  const generateMockHydrationData = (period: string): HydrationData[] => {
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

    const data: HydrationData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      // Generate realistic hydration data (2-4 liters per day)
      const hydration = 2.5 + Math.random() * 1.5;

      data.push({
        date: date.toISOString().split('T')[0],
        hydration: Math.round(hydration * 10) / 10
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

  const { data: hydrationData = [] } = useQuery({
    queryKey: ['hydration-chart', selectedPeriod],
    queryFn: async () => {
      // For now, return mock hydration data
      return generateMockHydrationData(selectedPeriod);
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

  const hydrationConfig = {
    hydration: {
      label: 'Hydratation (L)',
      color: '#06b6d4',
    },
  };

  return (
    <div className="space-y-6 bg-gray-100 p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Graphiques</h3>
        <div className="flex items-center space-x-3">
          <span className={`text-sm font-medium ${!isMonthView ? 'text-gray-900' : 'text-gray-500'}`}>
            7 jours
          </span>
          <Switch
            checked={isMonthView}
            onCheckedChange={setIsMonthView}
          />
          <span className={`text-sm font-medium ${isMonthView ? 'text-gray-900' : 'text-gray-500'}`}>
            1 mois
          </span>
        </div>
      </div>
      
      {/* CTL, ATL, TSB Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h4 className="text-md font-medium">Évolution CTL, ATL et TSB</h4>
        </div>
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
      </div>

      {/* Hydration Bar Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="h-5 w-5 text-cyan-500" />
          <h4 className="text-md font-medium">Hydratation quotidienne</h4>
        </div>
        <ChartContainer config={hydrationConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hydrationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                className="text-muted-foreground"
              />
              <YAxis 
                className="text-muted-foreground"
                domain={[0, 5]}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => {
                  const date = parseISO(value as string);
                  return format(date, 'dd MMMM yyyy', { locale: fr });
                }}
              />
              <Bar 
                dataKey="hydration" 
                fill="var(--color-hydration)" 
                name="Hydratation (L)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default TrainingStressChart;
