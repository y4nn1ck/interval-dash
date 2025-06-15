
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface IntervalsActivity {
  id: string;
  start_date_local: string;
  name: string;
  type: string;
  distance?: number;
  moving_time?: number;
  total_elevation_gain?: number;
  calories?: number;
}

const WorkoutSummary = () => {
  const today = new Date().toISOString().split('T')[0];

  const { data: todayWorkouts = [] } = useQuery({
    queryKey: ['intervals-activities', today],
    queryFn: async () => {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      
      if (!apiKey || !athleteId) {
        return [];
      }

      console.log(`Fetching activities for ${today} from Intervals.icu...`);
      
      const response = await fetch(`https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${today}&newest=${today}`, {
        headers: {
          'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch activities:', response.statusText);
        return [];
      }

      const activities = await response.json();
      console.log('Activities received:', activities);
      
      return activities as IntervalsActivity[];
    },
    enabled: !!(localStorage.getItem('intervals_api_key') && localStorage.getItem('intervals_athlete_id')),
  });

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    return (meters / 1000).toFixed(1) + ' km';
  };

  const getIntensityFromType = (type: string) => {
    // Simple intensity mapping based on activity type
    switch (type.toLowerCase()) {
      case 'run':
      case 'ride':
        return 'High';
      case 'walk':
        return 'Low';
      default:
        return 'Medium';
    }
  };

  if (todayWorkouts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No workouts recorded for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todayWorkouts.map((workout) => (
        <div key={workout.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{workout.name || workout.type}</h3>
            <Badge className={getIntensityColor(getIntensityFromType(workout.type))}>
              {getIntensityFromType(workout.type)}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">Today</p>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{formatDuration(workout.moving_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-gray-500" />
              <span>{workout.calories || 'N/A'} cal</span>
            </div>
            {workout.distance && (
              <div className="flex items-center gap-1 col-span-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{formatDistance(workout.distance)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutSummary;
