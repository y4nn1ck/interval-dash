import React, { useState } from 'react';
import { Heart, Moon, Target, Zap, TrendingUp as TrendUp, ChevronRight } from 'lucide-react';
import MetricCard from './MetricCard';
import RestingHRChart from './RestingHRChart';
import CTLChart from './CTLChart';
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
  const [isCTLDialogOpen, setIsCTLDialogOpen] = useState(false);
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

  // Generate CTL data for the chart
  const generateCTLData = () => {
    if (weeklyStats && weeklyStats.length > 0) {
      return weeklyStats.slice(-7).map(stat => ({
        date: stat.date,
        ctl: stat.ctl || 0,
      }));
    }

    // Fallback data for 7 days
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      let dayCTL;
      if (i === 6) {
        dayCTL = ctl || 67;
      } else {
        const baseCTL = 67;
        const variation = (Math.random() - 0.5) * 10;
        dayCTL = Math.max(0, baseCTL + variation);
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        ctl: Math.round(dayCTL),
      });
    }
    
    return data;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Dialog open={isRestingHRDialogOpen} onOpenChange={setIsRestingHRDialogOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer transition-all duration-200 hover:scale-105 relative group">
            <MetricCard
              title="FC Repos"
              value={`${todayMetrics.resting_hr || 58}`}
              unit="bpm"
              icon={Heart}
              color="bg-red-500"
            />
            {/* More visible clickable indicator */}
            <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110">
              <div className="flex items-center justify-center w-6 h-6 bg-white/90 rounded-full shadow-md">
                <ChevronRight className="w-3 h-3 text-red-500" />
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fréquence cardiaque de repos - 7 derniers jours</DialogTitle>
          </DialogHeader>
          <RestingHRChart data={generateRestingHRData()} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCTLDialogOpen} onOpenChange={setIsCTLDialogOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer transition-all duration-200 hover:scale-105 relative group">
            <MetricCard
              title="Fitness (CTL)"
              value={`${ctl}`}
              icon={Target}
              color="bg-green-500"
            />
            {/* More visible clickable indicator */}
            <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110">
              <div className="flex items-center justify-center w-6 h-6 bg-white/90 rounded-full shadow-md">
                <ChevronRight className="w-3 h-3 text-green-500" />
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fitness (CTL) - 7 derniers jours</DialogTitle>
          </DialogHeader>
          <CTLChart data={generateCTLData()} />
        </DialogContent>
      </Dialog>
      
      <MetricCard
        title="Fatigue (ATL)"
        value={`${atl}`}
        icon={Zap}
        color="bg-orange-500"
      />
      <MetricCard
        title="Forme (TSB)"
        value={`${tsb}`}
        icon={TrendUp}
        color="bg-blue-500"
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