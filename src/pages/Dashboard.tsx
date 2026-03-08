import React from 'react';
import SEO from '@/components/SEO';
import IntervalsAuth from '@/components/dashboard/IntervalsAuth';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KPICardsSection from '@/components/dashboard/KPICardsSection';
import WorkoutsSection from '@/components/dashboard/WorkoutsSection';
import UpcomingRaces from '@/components/dashboard/UpcomingRaces';
import { useIntervalsAuth, useIntervalsDailyStats } from '@/hooks/useIntervalsData';

const Dashboard = () => {
  const { isAuthenticated } = useIntervalsAuth();
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayStats } = useIntervalsDailyStats(today);

  const getStoredValue = (key: string, fallback: string) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  };

  const athleteName = getStoredValue('intervals_athlete_name', 'Athlète');
  const athleteId = getStoredValue('intervals_athlete_id', '');

  const todayMetrics = todayStats || {
    date: today,
    calories: 2240,
    resting_hr: 58,
    training_load: 65,
    sleep_secs: 28800,
    hrv_rmssd: 42,
    weight: 70.5,
    steps: 8543,
    ctl: 67,
    atl: 67,
    tsb: 0
  };

  const ctl = Math.round(todayStats?.ctl || 67);
  const atl = Math.round(todayStats?.atl || 67);
  const tsb = Math.round(todayStats?.tsb || 0);

  const formatSleepDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader athleteName={athleteName} athleteId={athleteId} />

        {!isAuthenticated && (
          <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <IntervalsAuth />
          </div>
        )}

        <KPICardsSection
          todayMetrics={todayMetrics}
          ctl={ctl}
          atl={atl}
          tsb={tsb}
          formatSleepDuration={formatSleepDuration}
        />

        {/* Upcoming Races */}
        <div className="mb-8">
          <UpcomingRaces />
        </div>

        {/* Workouts Section */}
        <WorkoutsSection />
      </div>
    </div>
  );
};

export default Dashboard;
