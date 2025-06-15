
import React from 'react';
import IntervalsAuth from '@/components/dashboard/IntervalsAuth';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KPICardsSection from '@/components/dashboard/KPICardsSection';
import ChartsSection from '@/components/dashboard/ChartsSection';
import WorkoutsSection from '@/components/dashboard/WorkoutsSection';
import { useIntervalsAuth, useIntervalsDailyStats } from '@/hooks/useIntervalsData';

const Dashboard = () => {
  const { isAuthenticated } = useIntervalsAuth();
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayStats } = useIntervalsDailyStats(today);

  // Get athlete info from localStorage
  const athleteName = localStorage.getItem('intervals_athlete_name') || 'Athlète';
  const athleteId = localStorage.getItem('intervals_athlete_id') || '';

  // Fallback to sample data if not authenticated or no data
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

  // Use real CTL, ATL, and TSB from API response or fallback values
  const ctl = Math.round(todayStats?.ctl || 67);
  const atl = Math.round(todayStats?.atl || 67);
  const tsb = Math.round(todayStats?.tsb || 0);

  // Format sleep duration properly
  const formatSleepDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}.${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <DashboardHeader athleteName={athleteName} athleteId={athleteId} />

        {/* Intervals.icu Auth Card */}
        {!isAuthenticated && (
          <div className="mb-8">
            <IntervalsAuth />
          </div>
        )}

        {/* KPI Cards */}
        <KPICardsSection
          todayMetrics={todayMetrics}
          ctl={ctl}
          atl={atl}
          tsb={tsb}
          formatSleepDuration={formatSleepDuration}
        />

        {/* Charts Section */}
        <ChartsSection ctl={ctl} atl={atl} />

        {/* Workouts Section */}
        <WorkoutsSection />
      </div>
    </div>
  );
};

export default Dashboard;
