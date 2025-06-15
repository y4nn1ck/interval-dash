import React, { useState } from 'react';
import { subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { intervalsService } from '@/services/intervalsService';
import CTLATLTSBChart from './CTLATLTSBChart';
import HydrationChart from './HydrationChart';
import ChartPeriodSwitch from './ChartPeriodSwitch';

interface TrainingStressData {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

interface HydrationData {
  date: string;
  hydration: number | null;
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

  const generateMockHydrationData = (): HydrationData[] => {
    const endDate = new Date();
    const days = 7; // Always 7 days for hydration
    const data: HydrationData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      // Generate realistic hydration data (1-5 scale)
      const hydration = Math.floor(Math.random() * 5) + 1;

      data.push({
        date: date.toISOString().split('T')[0],
        hydration: hydration
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
    queryKey: ['hydration-chart'],
    queryFn: async () => {
      // For now, return mock hydration data
      return generateMockHydrationData();
    },
  });

  return (
    <div className="space-y-8">
      <ChartPeriodSwitch 
        isMonthView={isMonthView} 
        onToggle={setIsMonthView} 
      />
      
      <CTLATLTSBChart 
        data={chartData} 
        selectedPeriod={selectedPeriod} 
      />

      <HydrationChart 
        data={hydrationData}
      />
    </div>
  );
};

export default TrainingStressChart;
