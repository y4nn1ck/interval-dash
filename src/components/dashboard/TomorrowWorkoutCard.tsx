
import React from 'react';
import { Clock, Target, MapPin, Calendar, Zap } from 'lucide-react';
import { Bike, Waves, PersonStanding } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PlannedWorkout {
  id: string;
  name: string;
  type: string;
  planned_date: string;
  duration?: number;
  distance?: number;
  description?: string;
  load?: number;
  moving_time?: number;
}

const TomorrowWorkoutCard = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: plannedWorkouts = [] } = useQuery({
    queryKey: ['planned-workouts-tomorrow', tomorrowStr],
    queryFn: async () => {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      
      if (!apiKey || !athleteId) {
        // Return mock planned workouts for demo
        return [
          {
            id: '3',
            name: 'Sortie Longue',
            type: 'Run',
            planned_date: tomorrowStr,
            moving_time: 7200,
            distance: 20000,
            description: 'Sortie longue en endurance',
            load: 120
          }
        ] as PlannedWorkout[];
      }

      console.log(`Fetching planned workouts for ${tomorrowStr} from Intervals.icu...`);
      
      const response = await fetch(`https://intervals.icu/api/v1/athlete/${athleteId}/events?oldest=${tomorrowStr}&newest=${tomorrowStr}`, {
        headers: {
          'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch tomorrow planned workouts:', response.statusText);
        return [];
      }

      const events = await response.json();
      console.log('Tomorrow planned workouts received:', events);
      
      return events.filter((event: any) => event.category === 'WORKOUT') as PlannedWorkout[];
    },
    enabled: true,
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}min`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    return (meters / 1000).toFixed(1) + ' km';
  };

  const getActivityIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('bike') || lowerType.includes('ride') || lowerType.includes('cycling')) {
      return Bike;
    }
    if (lowerType.includes('swim')) {
      return Waves;
    }
    return PersonStanding; // Default for run and other activities
  };

  const getActivityColors = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('bike') || lowerType.includes('ride') || lowerType.includes('cycling')) {
      return {
        bg: 'bg-green-50',
        hover: 'hover:bg-green-100',
        border: 'border-green-200',
        icon: 'text-green-500'
      };
    }
    if (lowerType.includes('swim')) {
      return {
        bg: 'bg-blue-50',
        hover: 'hover:bg-blue-100',
        border: 'border-blue-200',
        icon: 'text-blue-500'
      };
    }
    return {
      bg: 'bg-orange-50',
      hover: 'hover:bg-orange-100',
      border: 'border-orange-200',
      icon: 'text-orange-500'
    };
  };

  if (plannedWorkouts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Aucune séance planifiée pour demain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plannedWorkouts.map((workout) => {
        const ActivityIcon = getActivityIcon(workout.type);
        const colors = getActivityColors(workout.type);
        
        return (
          <div key={workout.id} className={`p-4 ${colors.bg} rounded-lg ${colors.hover} transition-colors border ${colors.border}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <ActivityIcon className={`h-5 w-5 ${colors.icon}`} />
                <h3 className="font-semibold text-gray-900">{workout.name}</h3>
              </div>
            </div>
            
            {workout.description && (
              <p className="text-sm text-gray-600 mb-3 italic">{workout.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Clock className={`h-4 w-4 ${colors.icon}`} />
                <span>{formatDuration(workout.moving_time)}</span>
              </div>
              {workout.distance && (
                <div className="flex items-center gap-1">
                  <MapPin className={`h-4 w-4 ${colors.icon}`} />
                  <span>{formatDistance(workout.distance)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Target className={`h-4 w-4 ${colors.icon}`} />
                <span>{workout.type}</span>
              </div>
              {workout.load && (
                <div className="flex items-center gap-1">
                  <Zap className={`h-4 w-4 ${colors.icon}`} />
                  <span>Load: {workout.load}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TomorrowWorkoutCard;
