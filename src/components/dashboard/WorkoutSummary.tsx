

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, MapPin, Heart, Smile, Utensils, Activity } from 'lucide-react';
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
  icu_rpe?: number;
  feel?: number;
  carbs_ingested?: number;
  icu_training_load?: number;
  icu_weighted_avg_watts?: number;
  icu_average_watts?: number;
}

const WorkoutSummary = () => {
  const today = new Date().toISOString().split('T')[0];

  const { data: todayWorkouts = [] } = useQuery({
    queryKey: ['intervals-activities', today],
    queryFn: async () => {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      
      if (!apiKey || !athleteId) {
        // Return mock data with RPE, Feeling, CHO, training load and power data for demo
        return [
          {
            id: '1',
            start_date_local: today,
            name: 'Course Matinale',
            type: 'Run',
            distance: 8000,
            moving_time: 2400,
            calories: 420,
            icu_rpe: 7,
            feel: 4,
            carbs_ingested: 45,
            icu_training_load: 85,
            icu_weighted_avg_watts: 245,
            icu_average_watts: 230
          },
          {
            id: '2',
            start_date_local: today,
            name: 'Séance Force',
            type: 'WeightTraining',
            moving_time: 3600,
            calories: 280,
            icu_rpe: 8,
            feel: 3,
            carbs_ingested: 30,
            icu_training_load: 65
          }
        ] as IntervalsActivity[];
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
      
      return activities.map((activity: any) => ({
        id: activity.id,
        start_date_local: activity.start_date_local,
        name: activity.name,
        type: activity.type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        calories: activity.calories,
        icu_rpe: activity.icu_rpe,
        feel: activity.feel,
        carbs_ingested: activity.carbs_ingested,
        icu_training_load: activity.icu_training_load,
        icu_weighted_avg_watts: activity.icu_weighted_avg_watts,
        icu_average_watts: activity.icu_average_watts
      })) as IntervalsActivity[];
    },
    enabled: true, // Always enabled to show demo data
  });

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRPEColor = (rpe: number) => {
    if (rpe >= 9) return 'bg-red-100 text-red-800';
    if (rpe >= 7) return 'bg-orange-100 text-orange-800';
    if (rpe >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getFeelingColor = (feeling: number) => {
    if (feeling >= 4) return 'bg-green-100 text-green-800';
    if (feeling >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
      case 'virtualride':
        return 'High';
      case 'walk':
        return 'Low';
      default:
        return 'Medium';
    }
  };

  const getFeelingEmoji = (feeling: number) => {
    if (feeling >= 4) return '😊';
    if (feeling >= 3) return '😐';
    return '😔';
  };

  const isPowerActivity = (type: string) => {
    return ['Run', 'Ride', 'VirtualRide', 'Bike'].includes(type);
  };

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
        <div key={workout.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900">{workout.name || workout.type}</h3>
            <div className="flex gap-2">
              {workout.icu_rpe && (
                <Badge className={getRPEColor(workout.icu_rpe)}>
                  RPE {workout.icu_rpe}
                </Badge>
              )}
              {workout.icu_training_load && (
                <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
                  <Zap className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium">{workout.icu_training_load}</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">Aujourd'hui</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{formatDuration(workout.moving_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-gray-500" />
              <span>{workout.calories || 'N/A'} cal</span>
            </div>
            {workout.distance && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{formatDistance(workout.distance)}</span>
              </div>
            )}
            {workout.icu_training_load && (
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-gray-500" />
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
                <Smile className="h-4 w-4 text-gray-500" />
                <span className="flex items-center gap-1">
                  Ressenti {getFeelingEmoji(workout.feel)} {workout.feel}/5
                </span>
              </div>
            )}
            {workout.carbs_ingested && (
              <div className="flex items-center gap-1">
                <Utensils className="h-4 w-4 text-gray-500" />
                <span>CHO {workout.carbs_ingested}g</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutSummary;

