
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Activity, Moon, Target, TrendingUp, Calendar } from 'lucide-react';
import StepsChart from '@/components/dashboard/StepsChart';
import HeartRateChart from '@/components/dashboard/HeartRateChart';
import SleepChart from '@/components/dashboard/SleepChart';
import WorkoutSummary from '@/components/dashboard/WorkoutSummary';
import MetricCard from '@/components/dashboard/MetricCard';

const Dashboard = () => {
  // Sample data that would come from Garmin Connect API
  const todayMetrics = {
    steps: 8743,
    stepsGoal: 10000,
    heartRate: 72,
    sleepHours: 7.5,
    sleepGoal: 8,
    activeMinutes: 45,
    calories: 2240
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Garmin Connect Dashboard</h1>
          <p className="text-gray-600">Track your health and fitness metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Steps Today"
            value={todayMetrics.steps.toLocaleString()}
            goal={todayMetrics.stepsGoal.toLocaleString()}
            icon={Activity}
            color="bg-blue-500"
            progress={(todayMetrics.steps / todayMetrics.stepsGoal) * 100}
          />
          <MetricCard
            title="Resting Heart Rate"
            value={`${todayMetrics.heartRate}`}
            unit="bpm"
            icon={Heart}
            color="bg-red-500"
            trend="+2"
          />
          <MetricCard
            title="Sleep Last Night"
            value={`${todayMetrics.sleepHours}`}
            unit="hours"
            goal={`${todayMetrics.sleepGoal}h`}
            icon={Moon}
            color="bg-purple-500"
            progress={(todayMetrics.sleepHours / todayMetrics.sleepGoal) * 100}
          />
          <MetricCard
            title="Active Minutes"
            value={`${todayMetrics.activeMinutes}`}
            unit="min"
            icon={Target}
            color="bg-green-500"
            trend="+5"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Steps This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StepsChart />
            </CardContent>
          </Card>

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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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
