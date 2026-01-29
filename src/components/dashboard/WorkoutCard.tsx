
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, MapPin, Heart, Smile, Utensils, Activity, CheckCircle } from 'lucide-react';
import { IntervalsActivity } from '@/types/workout';
import { formatDuration, formatDistance, getFeelingEmoji, isPowerActivity } from '@/utils/workoutFormatters';
import { getRPEColor, getConformityColor } from '@/utils/workoutStyles';

interface WorkoutCardProps {
  workout: IntervalsActivity;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout }) => {
  const conformityScore = Math.round(workout.compliance || 85);

  return (
    <div className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors border border-border/50">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-foreground">{workout.name || workout.type}</h3>
        <div className="flex gap-2">
          <Badge className={getConformityColor(conformityScore)}>
            <CheckCircle className="h-3 w-3 mr-1" />
            {conformityScore}%
          </Badge>
          {workout.icu_rpe && (
            <Badge className={getRPEColor(workout.icu_rpe)}>
              RPE {workout.icu_rpe}
            </Badge>
          )}
          {workout.icu_training_load && (
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-foreground">{workout.icu_training_load}</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">Aujourd'hui</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatDuration(workout.moving_time)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span>{workout.calories || 'N/A'} cal</span>
        </div>
        {workout.distance && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{formatDistance(workout.distance)}</span>
          </div>
        )}
        {workout.icu_training_load && (
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span>Load {workout.icu_training_load}</span>
          </div>
        )}
        {isPowerActivity(workout.type) && workout.icu_weighted_avg_watts && (
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-orange-500" />
            <span>NP {workout.icu_weighted_avg_watts}W</span>
          </div>
        )}
        {isPowerActivity(workout.type) && workout.icu_average_watts && (
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4 text-blue-500" />
            <span>Avg {workout.icu_average_watts}W</span>
          </div>
        )}
        {workout.feel && (
          <div className="flex items-center gap-1">
            <Smile className="h-4 w-4 text-muted-foreground" />
            <span className="flex items-center gap-1">
              Ressenti {getFeelingEmoji(workout.feel)} {workout.feel}/5
            </span>
          </div>
        )}
        {workout.carbs_ingested && (
          <div className="flex items-center gap-1">
            <Utensils className="h-4 w-4 text-muted-foreground" />
            <span>CHO {workout.carbs_ingested}g</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutCard;
