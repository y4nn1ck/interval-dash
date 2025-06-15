
import React from 'react';
import { Clock, Target, MapPin, Calendar, Zap } from 'lucide-react';
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

const PlannedWorkoutCard = () => {
  const today = new Date().toISOString().split('T')[0];

  const { data: plannedWorkouts = [] } = useQuery({
    queryKey: ['planned-workouts', today],
    queryFn: async () => {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      
      if (!apiKey || !athleteId) {
        // Return mock planned workouts for demo
        return [
          {
            id: '1',
            name: 'Entraînement Intervalles',
            type: 'Run',
            planned_date: today,
            moving_time: 3600,
            distance: 10000,
            description: '5x1000m @ seuil',
            load: 85
          },
          {
            id: '2',
            name: 'Récupération Active',
            type: 'Easy Run',
            planned_date: today,
            moving_time: 2400,
            distance: 5000,
            description: 'Course facile 40min',
            load: 35
          }
        ] as PlannedWorkout[];
      }

      console.log(`Fetching planned workouts for ${today} from Intervals.icu...`);
      
      const response = await fetch(`https://intervals.icu/api/v1/athlete/${athleteId}/events?oldest=${today}&newest=${today}`, {
        headers: {
          'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch planned workouts:', response.statusText);
        return [];
      }

      const events = await response.json();
      console.log('Planned workouts received:', events);
      
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

  if (plannedWorkouts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Aucune séance planifiée pour aujourd'hui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plannedWorkouts.map((workout) => (
        <div key={workout.id} className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900">{workout.name}</h3>
          </div>
          
          {workout.description && (
            <p className="text-sm text-gray-600 mb-3 italic">{workout.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>{formatDuration(workout.moving_time)}</span>
            </div>
            {workout.distance && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span>{formatDistance(workout.distance)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-purple-500" />
              <span>{workout.type}</span>
            </div>
            {workout.load && (
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-purple-500" />
                <span>Load: {workout.load}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlannedWorkoutCard;
