
import React, { useState } from 'react';
import { Heart, Moon, Target, Zap, TrendingUp as TrendUp } from 'lucide-react';
import MetricCard from './MetricCard';
import RestingHRChart from './RestingHRChart';
import { IntervalsDailyStats } from '@/services/intervalsService';
import { useIntervalsWeeklyStats } from '@/hooks/useIntervalsData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface KPICardsSectionProps {
  todayMetrics: IntervalsDailyStats;
  ctl: number;
  atl: number;
  tsb: number;
  formatSleepDuration: (seconds: number) => string;
}

const KPICardsSection = ({ todayMetrics, ctl, atl, tsb, formatSleepDuration }: KPICardsSectionProps) => {
  const [isRestingHRDialogOpen, setIsRestingHRDialogOpen] = useState(false);
  const { data: weeklyStats } = useIntervalsWeeklyStats();

  // Generate resting HR data for the chart
  const generateRestingHRData = () => {
    if (weeklyStats && weeklyStats.length > 0) {
      return weeklyStats.slice(-7).map(stat => ({
        date: stat.date,
        resting_hr: stat.resting_hr || 0,
      }));
    }

    // Fallback data for 7 days
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      let dayRestingHR;
      if (i === 6) {
        dayRestingHR = todayMetrics.resting_hr || 58;
      } else {
        const baseHR = 58;
        const variation = (Math.random() - 0.5) * 4;
        dayRestingHR = Math.max(50, baseHR + variation);
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        resting_hr: Math.round(dayRestingHR),
      });
    }
    
    return data;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Dialog open={isRestingHRDialogOpen} onOpenChange={setIsRestingHRDialogOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            <MetricCard
              title="FC Repos"
              value={`${todayMetrics.resting_hr || 58}`}
              unit="bpm"
              icon={Heart}
              color="bg-red-500"
              trend="+2"
            />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fréquence cardiaque de repos - 7 derniers jours</DialogTitle>
          </DialogHeader>
          <RestingHRChart data={generateRestingHRData()} />
        </DialogContent>
      </Dialog>
      
      <MetricCard
        title="Fitness (CTL)"
        value={`${ctl}`}
        icon={Target}
        color="bg-green-500"
        trend="+5"
      />
      <MetricCard
        title="Fatigue (ATL)"
        value={`${atl}`}
        icon={Zap}
        color="bg-orange-500"
        trend="-3"
      />
      <MetricCard
        title="Forme (TSB)"
        value={`${tsb}`}
        icon={TrendUp}
        color="bg-blue-500"
        trend="+2"
      />
      <MetricCard
        title="Sommeil"
        value={formatSleepDuration(todayMetrics.sleep_secs || 28800)}
        unit="h"
        icon={Moon}
        color="bg-purple-500"
      />
    </div>
  );
};

export default KPICardsSection;
