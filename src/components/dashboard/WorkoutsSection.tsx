
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
              Prévu Demain
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
