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

  const hydrationConfig = {
    hydration: {
      label: 'Hydratation (L)',
      color: '#06b6d4',
    },
  };

  return (
    <div className="space-y-8">
      {/* Header with elegant switch */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Graphiques</h3>
        <div className="flex items-center space-x-4 bg-white rounded-full p-2 shadow-lg border border-gray-100">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
            !isMonthView 
              ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md' 
              : 'text-gray-600 hover:text-gray-800'
          }`}>
            7 jours
          </span>
          <Switch
            checked={isMonthView}
            onCheckedChange={setIsMonthView}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600"
          />
          <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
            isMonthView 
              ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md' 
              : 'text-gray-600 hover:text-gray-800'
          }`}>
            1 mois
          </span>
        </div>
      </div>
      
      {/* CTL, ATL, TSB Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 backdrop-blur-sm bg-white/95">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h4 className="text-xl font-semibold text-gray-800">Évolution CTL, ATL et TSB</h4>
        </div>
        <ChartContainer config={chartConfig} className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              <Line 
                type="monotone" 
                dataKey="ctl" 
                stroke="var(--color-ctl)" 
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--color-ctl)", strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: "var(--color-ctl)", strokeWidth: 2, fill: '#fff' }}
                name="CTL (Fitness)"
                fill="url(#ctlGradient)"
              />
              <Line 
                type="monotone" 
                dataKey="atl" 
                stroke="var(--color-atl)" 
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--color-atl)", strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: "var(--color-atl)", strokeWidth: 2, fill: '#fff' }}
                name="ATL (Fatigue)"
                fill="url(#atlGradient)"
              />
              <Line 
                type="monotone" 
                dataKey="tsb" 
                stroke="var(--color-tsb)" 
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--color-tsb)", strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: "var(--color-tsb)", strokeWidth: 2, fill: '#fff' }}
                name="TSB (Forme)"
                fill="url(#tsbGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Hydration Bar Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 backdrop-blur-sm bg-white/95">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
            <Droplets className="h-6 w-6 text-white" />
          </div>
          <h4 className="text-xl font-semibold text-gray-800">Hydratation quotidienne</h4>
        </div>
        <ChartContainer config={hydrationConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hydrationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
    </div>
  );
};

export default TrainingStressChart;
