
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Activity, Moon, Target, TrendingUp, Calendar, Zap, TrendingUp as TrendUp } from 'lucide-react';
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

  // Calculate fatigue (typically training load - fitness, but we'll use a simple calculation)
  const fatigue = todayMetrics.training_load ? Math.round(todayMetrics.training_load * 0.8).toString() : '52';
  
  // Calculate TSB (Training Stress Balance) - typically Fitness - Fatigue
  // For demo purposes, we'll use a simple calculation based on training load
  const fitness = todayMetrics.training_load ? Math.round(todayMetrics.training_load * 1.2).toString() : '78';
  const tsb = (parseInt(fitness) - parseInt(fatigue)).toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de Bord Intervals.icu</h1>
          <p className="text-gray-600">Track your training and wellness metrics</p>
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
            value={`${todayMetrics.training_load ? Math.round(todayMetrics.training_load) : '65'}`}
            icon={Target}
            color="bg-green-500"
            trend="+5"
          />
          <MetricCard
            title="Fatigue ATL"
            value={fatigue}
            icon={Zap}
            color="bg-orange-500"
            trend="-3"
          />
          <MetricCard
            title="Forme (TSB)"
            value={tsb}
            icon={TrendUp}
            color="bg-blue-500"
            trend="+2"
          />
          <MetricCard
            title="Sommeil"
            value={`${todayMetrics.sleep_secs ? Math.round(todayMetrics.sleep_secs / 3600 * 10) / 10 : 8.0}`}
            unit="h"
            icon={Moon}
            color="bg-purple-500"
            trend="+0.5"
          />
        </div>

        {/* Today's Workouts */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Today's Workouts
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
