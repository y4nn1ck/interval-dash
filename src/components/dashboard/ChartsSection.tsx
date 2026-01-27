import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CTLATLTSBChart from './CTLATLTSBChart';
import HydrationChart from './HydrationChart';
import SleepChart from './SleepChart';
import { useIntervalsWeeklyStats } from '@/hooks/useIntervalsData';

interface ChartsSectionProps {
  ctl: number;
  atl: number;
}

const ChartsSection = ({ ctl, atl }: ChartsSectionProps) => {
  const { data: weeklyStats } = useIntervalsWeeklyStats();

  // Generate CTL/ATL/TSB data for 7 days
  const generateCTLATLData = () => {
    if (weeklyStats && weeklyStats.length > 0) {
      const last7Days = weeklyStats.slice(-7);
      return last7Days.map(stat => ({
        date: stat.date,
        ctl: Math.round(stat.ctl || 0),
        atl: Math.round(stat.atl || 0),
        tsb: Math.round(stat.tsb || 0),
      }));
    }

    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      let dayCtl, dayAtl, dayTsb;
      
      if (i === 6) {
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

  const generateHydrationData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      let hydration = null;
      
      if (weeklyStats && weeklyStats.length > 0) {
        const apiData = weeklyStats.find(stat => stat.date === dateStr);
        if (apiData && apiData.hydration !== null && apiData.hydration !== undefined) {
          hydration = apiData.hydration;
        }
      }
      
      if (hydration === null || hydration === undefined) {
        const fallbackValues = [1, 2, 1, 3, 2, 1, 4];
        hydration = fallbackValues[i];
      }
      
      if (hydration === null || hydration === undefined) {
        hydration = 0;
      }
      
      data.push({
        date: dateStr,
        hydration: hydration,
      });
    }
    
    return data;
  };

  const generateSleepData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      let sleepHours = null;
      
      if (weeklyStats && weeklyStats.length > 0) {
        const apiData = weeklyStats.find(stat => stat.date === dateStr);
        if (apiData && apiData.sleep_secs !== null && apiData.sleep_secs !== undefined) {
          sleepHours = apiData.sleep_secs / 3600;
        }
      }
      
      if (sleepHours === null) {
        const fallbackValues = [7.5, 8.2, 6.8, 7.9, 8.1, 6.5, 8.5];
        sleepHours = fallbackValues[i];
      }
      
      data.push({
        date: dateStr,
        sleep_hours: sleepHours,
      });
    }
    
    return data;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* CTL/ATL/TSB Chart */}
      <Card className="glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            <span className="gradient-text">Évolution CTL, ATL et TSB</span>
            <span className="text-muted-foreground text-sm font-normal ml-2">(7 jours)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CTLATLTSBChart 
            data={generateCTLATLData()} 
            selectedPeriod="7days" 
          />
        </CardContent>
      </Card>

      {/* Sleep Chart */}
      <Card className="glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            <span className="gradient-text">Sommeil quotidien</span>
            <span className="text-muted-foreground text-sm font-normal ml-2">(7 jours)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SleepChart data={generateSleepData()} />
        </CardContent>
      </Card>

      {/* Hydration Chart */}
      <Card className="glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            <span className="gradient-text">Hydratation quotidienne</span>
            <span className="text-muted-foreground text-sm font-normal ml-2">(7 jours)</span>
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
