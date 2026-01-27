import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CalendarDays, CalendarClock } from 'lucide-react';
import WorkoutSummary from './WorkoutSummary';
import PlannedWorkoutCard from './PlannedWorkoutCard';
import TomorrowWorkoutCard from './TomorrowWorkoutCard';

const WorkoutsSection = () => {
  return (
    <>
      {/* Planned Workouts and Today's Workouts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <CalendarDays className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-foreground">Prévu Aujourd'hui</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlannedWorkoutCard />
          </CardContent>
        </Card>

        <Card className="glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-foreground">Séance(s) du jour</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkoutSummary />
          </CardContent>
        </Card>
      </div>

      {/* Tomorrow's Workouts - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <CalendarClock className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-foreground">Prévu Demain</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TomorrowWorkoutCard />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WorkoutsSection;
