
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CTLATLTSBChart from './CTLATLTSBChart';
import HydrationChart from './HydrationChart';
import ChartPeriodSwitch from './ChartPeriodSwitch';
import { useIntervalsWeeklyStats, useIntervalsMonthlyStats } from '@/hooks/useIntervalsData';

interface ChartsSectionProps {
  ctl: number;
  atl: number;
}

const ChartsSection = ({ ctl, atl }: ChartsSectionProps) => {
  const [ctlatlPeriod, setCtlatlPeriod] = useState('7days');
  const [hydrationPeriod, setHydrationPeriod] = useState('7days');

  // Fetch real data from Intervals.icu
  const { data: weeklyStats } = useIntervalsWeeklyStats();
  const { data: monthlyStats } = useIntervalsMonthlyStats();

  // Generate CTL/ATL/TSB data from real API data
  const generateCTLATLData = (period: string) => {
    const statsData = period === '7days' ? weeklyStats : monthlyStats;
    
    if (statsData && statsData.length > 0) {
      return statsData.map(stat => ({
        date: stat.date,
        ctl: Math.round(stat.ctl || 0),
        atl: Math.round(stat.atl || 0),
        tsb: Math.round(stat.tsb || 0),
      }));
    }

    // Fallback data if API fails
    const days = period === '7days' ? 7 : 30;
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      let dayCtl, dayAtl, dayTsb;
      
      if (i === days - 1) {
        dayCtl = ctl;
        dayAtl = atl;
        dayTsb = ctl - atl;
      } else {
        const baseCtl = 67;
        const baseAtl = 65;
        const variation = (Math.random() - 0.5) * 4;
        
        dayCtl = Math.max(60, baseCtl + variation + (Math.random() - 0.5) * 2);
        dayAtl = Math.max(55, baseAtl + variation + (Math.random() - 0.5) * 3);
        dayTsb = dayCtl - dayAtl;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        ctl: Math.round(dayCtl),
        atl: Math.round(dayAtl),
        tsb: Math.round(dayTsb),
      });
    }
    
    return data;
  };

  // Generate hydration data from real API data
  const generateHydrationData = (period: string) => {
    const statsData = period === '7days' ? weeklyStats : monthlyStats;
    const days = period === '7days' ? 7 : 30;
    
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      let hydration = null;
      
      // Find matching data from API
      if (statsData && statsData.length > 0) {
        const apiData = statsData.find(stat => stat.date === dateStr);
        if (apiData && apiData.hydration !== null && apiData.hydration !== undefined) {
          hydration = apiData.hydration;
        }
      }
      
      // Only show hydration for last 2 days if no API data
      if (hydration === null && (i === days - 1 || i === days - 2)) {
        hydration = 1;
      }
      
      data.push({
        date: dateStr,
        hydration: hydration,
      });
    }
    
    return data;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* CTL/ATL/TSB Chart */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Évolution CTL, ATL et TSB
            </CardTitle>
            <ChartPeriodSwitch
              isMonthView={ctlatlPeriod === '1month'}
              onToggle={(isMonthView) => setCtlatlPeriod(isMonthView ? '1month' : '7days')}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CTLATLTSBChart 
            data={generateCTLATLData(ctlatlPeriod)} 
            selectedPeriod={ctlatlPeriod} 
          />
        </CardContent>
      </Card>

      {/* Hydration Chart */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Hydratation quotidienne
            </CardTitle>
            <ChartPeriodSwitch
              isMonthView={hydrationPeriod === '1month'}
              onToggle={(isMonthView) => setHydrationPeriod(isMonthView ? '1month' : '7days')}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <HydrationChart 
            data={generateHydrationData(hydrationPeriod)} 
            selectedPeriod={hydrationPeriod} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;
