
import React from 'react';
import { Heart, Moon, Target, Zap, TrendingUp as TrendUp } from 'lucide-react';
import MetricCard from './MetricCard';
import { IntervalsDailyStats } from '@/services/intervalsService';

interface KPICardsSectionProps {
  todayMetrics: IntervalsDailyStats;
  ctl: number;
  atl: number;
  tsb: number;
  formatSleepDuration: (seconds: number) => string;
}

const KPICardsSection = ({ todayMetrics, ctl, atl, tsb, formatSleepDuration }: KPICardsSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <MetricCard
        title="FC Repos"
        value={`${todayMetrics.resting_hr || 58}`}
        unit="bpm"
        icon={Heart}
        color="bg-red-500"
        trend="+2"
      />
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
