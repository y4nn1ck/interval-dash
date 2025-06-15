
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Activity, Moon, Target, TrendingUp, Calendar } from 'lucide-react';
import HeartRateChart from '@/components/dashboard/HeartRateChart';
import SleepChart from '@/components/dashboard/SleepChart';
import WorkoutSummary from '@/components/dashboard/WorkoutSummary';
import MetricCard from '@/components/dashboard/MetricCard';
import IntervalsAuth from '@/components/dashboard/IntervalsAuth';
import { useIntervalsAuth, useIntervalsDailyStats, useIntervalsWeeklyStats } from '@/hooks/useIntervalsData';

const Dashboard = () => {
  const { isAuthenticated } = useIntervalsAuth();
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayStats } = useIntervalsDailyStats(today);
  const { data: weeklyStats } = useIntervalsWeeklyStats();

  // Fallback to sample data if not authenticated or no data
  const todayMetrics = todayStats || {
    calories: 2240,
    resting_hr: 58,
    training_load: 65,
    sleep_secs: 28800
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Intervals.icu Dashboard</h1>
          <p className="text-gray-600">Track your training and wellness metrics</p>
        </div>

        {/* Intervals.icu Auth Card */}
        {!isAuthenticated && (
          <div className="mb-8">
            <IntervalsAuth />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Resting Heart Rate"
            value={`${todayMetrics.resting_hr || 58}`}
            unit="bpm"
            icon={Heart}
            color="bg-red-500"
            trend="+2"
          />
          <MetricCard
            title="Training Load"
            value={`${todayMetrics.training_load ? todayMetrics.training_load.toFixed(2) : '65.00'}`}
            icon={Target}
            color="bg-green-500"
            trend="+5"
          />
          <MetricCard
            title="Sleep Duration"
            value={`${todayMetrics.sleep_secs ? Math.round(todayMetrics.sleep_secs / 3600 * 10) / 10 : 8.0}`}
            unit="h"
            icon={Moon}
            color="bg-purple-500"
            trend="+0.5"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Heart Rate Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HeartRateChart />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-purple-500" />
                Sleep Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SleepChart />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Recent Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutSummary />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
