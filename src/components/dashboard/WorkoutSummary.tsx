
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, MapPin } from 'lucide-react';

const WorkoutSummary = () => {
  const workouts = [
    {
      id: 1,
      type: 'Running',
      duration: '45 min',
      calories: 420,
      distance: '6.2 km',
      date: 'Today',
      intensity: 'High'
    },
    {
      id: 2,
      type: 'Cycling',
      duration: '1h 20min',
      calories: 580,
      distance: '25.4 km',
      date: 'Yesterday',
      intensity: 'Medium'
    },
    {
      id: 3,
      type: 'Swimming',
      duration: '35 min',
      calories: 320,
      distance: '1.2 km',
      date: '2 days ago',
      intensity: 'High'
    },
    {
      id: 4,
      type: 'Strength',
      duration: '50 min',
      calories: 280,
      distance: null,
      date: '3 days ago',
      intensity: 'Medium'
    }
  ];

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <div key={workout.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{workout.type}</h3>
            <Badge className={getIntensityColor(workout.intensity)}>
              {workout.intensity}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{workout.date}</p>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{workout.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-gray-500" />
              <span>{workout.calories} cal</span>
            </div>
            {workout.distance && (
              <div className="flex items-center gap-1 col-span-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{workout.distance}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutSummary;
