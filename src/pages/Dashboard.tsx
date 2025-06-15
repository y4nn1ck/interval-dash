
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Activity, Moon, Target, TrendingUp, Calendar, Zap, TrendingUp as TrendUp, CalendarDays, CalendarClock } from 'lucide-react';
import WorkoutSummary from '@/components/dashboard/WorkoutSummary';
import MetricCard from '@/components/dashboard/MetricCard';
import IntervalsAuth from '@/components/dashboard/IntervalsAuth';
import TrainingStressChart from '@/components/dashboard/TrainingStressChart';
import PlannedWorkoutCard from '@/components/dashboard/PlannedWorkoutCard';
import TomorrowWorkoutCard from '@/components/dashboard/TomorrowWorkoutCard';
import { useIntervalsAuth, useIntervalsDailyStats, useIntervalsWeeklyStats } from '@/hooks/useIntervalsData';

const Dashboard = () => {
  const { isAuthenticated } = useIntervalsAuth();
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayStats } = useIntervalsDailyStats(today);
  const { data: weeklyStats } = useIntervalsWeeklyStats();

  // Get athlete info from localStorage
  const athleteName = localStorage.getItem('intervals_athlete_name') || 'Athlète';
  const athleteId = localStorage.getItem('intervals_athlete_id') || '';

  // Fallback to sample data if not authenticated or no data
  const todayMetrics = todayStats || {
    calories: 2240,
    resting_hr: 58,
    training_load: 65,
    sleep_secs: 28800
  };

  // Use real CTL, ATL, and TSB from API response or fallback values
  const ctl = Math.round(todayStats?.ctl || 72);
  const atl = Math.round(todayStats?.atl || 58);
  const tsb = Math.round(todayStats?.tsb || (ctl - atl));

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de Bord Intervals.icu</h1>
          <p className="text-gray-600">
            Suivi des métriques de {athleteName} {athleteId && `(${athleteId})`}
          </p>
        </div>

        {/* Intervals.icu Auth Card */}
        {!isAuthenticated && (
          <div className="mb-8">
            <IntervalsAuth />
          </div>
        )}

        {/* KPI Cards */}
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
            trend="+0.5"
          />
        </div>

        {/* Training Stress Chart */}
        <div className="mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Évolution CTL, ATL et TSB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrainingStressChart />
            </CardContent>
          </Card>
        </div>

        {/* Planned Workouts and Today's Workouts - First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-purple-500" />
                Prévu Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlannedWorkoutCard />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Séance(s) du jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutSummary />
            </CardContent>
          </Card>
        </div>

        {/* Tomorrow's Workouts - Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-blue-500" />
                Demain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TomorrowWorkoutCard />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
