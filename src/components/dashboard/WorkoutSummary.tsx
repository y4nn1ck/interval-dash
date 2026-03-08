
import React from 'react';
import WorkoutCard from './WorkoutCard';
import StravaPendingBanner from './StravaPendingBanner';
import { useTodayWorkouts } from '@/hooks/useTodayWorkouts';

const WorkoutSummary = () => {
  const { data: todayWorkouts = [], pendingStravaCount, refetch, isFetching } = useTodayWorkouts();

  return (
    <div className="space-y-4">
      <StravaPendingBanner count={pendingStravaCount} onRefresh={() => refetch()} isRefreshing={isFetching} />
      {todayWorkouts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune séance enregistrée pour aujourd'hui.</p>
        </div>
      ) : (
        todayWorkouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))
      )}
    </div>
  );
};

export default WorkoutSummary;
