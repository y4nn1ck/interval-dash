
import React from 'react';
import WorkoutCard from './WorkoutCard';
import { useTodayWorkouts } from '@/hooks/useTodayWorkouts';

const WorkoutSummary = () => {
  const { data: todayWorkouts = [] } = useTodayWorkouts();

  if (todayWorkouts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucune séance enregistrée pour aujourd'hui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todayWorkouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
};

export default WorkoutSummary;
