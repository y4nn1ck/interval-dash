
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

  // Generate 7 days of hydration data
  const generateHydrationData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      let hydration = null;
      
      // Find matching data from API
      if (weeklyStats && weeklyStats.length > 0) {
        const apiData = weeklyStats.find(stat => stat.date === dateStr);
        if (apiData && apiData.hydration !== null && apiData.hydration !== undefined) {
          hydration = apiData.hydration;
        }
      }
      
      // Only show hydration for last 2 days if no API data
      if (hydration === null && (i >= 5)) {
        hydration = Math.floor(Math.random() * 3) + 1; // Random 1-3 for demo
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

      {/* Hydration Chart - 7 days only, no switch */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Hydratation quotidienne (7 jours)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <HydrationChart data={generateHydrationData()} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;
