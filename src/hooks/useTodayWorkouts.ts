
import { useQuery } from '@tanstack/react-query';
import { IntervalsActivity } from '@/types/workout';

interface TodayWorkoutsResult {
  activities: IntervalsActivity[];
  pendingStravaCount: number;
}

export const useTodayWorkouts = () => {
  const today = new Date().toISOString().split('T')[0];

  const query = useQuery<TodayWorkoutsResult>({
    queryKey: ['intervals-activities', today],
    queryFn: async () => {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      
      if (!apiKey || !athleteId) {
        return {
          activities: [
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
              icu_average_watts: 230,
              compliance: 95
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
              icu_training_load: 65,
              compliance: 88
            }
          ] as IntervalsActivity[],
          pendingStravaCount: 0
        };
      }

      console.log(`Fetching activities for ${today} from Intervals.icu...`);
      
      const response = await fetch(`https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${today}&newest=${today}`, {
        headers: {
          'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch activities:', response.statusText);
        return { activities: [], pendingStravaCount: 0 };
      }

      const activities = await response.json();
      console.log('Activities received:', activities);
      
      const stravaActivities = activities.filter((activity: any) => 
        activity.source === 'STRAVA' || !activity.type
      );
      const pendingStravaCount = stravaActivities.length;
      
      const validActivities = activities.filter((activity: any) => 
        activity.source !== 'STRAVA' && activity.type
      );
      console.log('Valid activities (excluding STRAVA-only):', validActivities.length);
      console.log('Pending STRAVA activities:', pendingStravaCount);
      
      return {
        activities: validActivities.map((activity: any) => ({
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
          icu_average_watts: activity.icu_average_watts,
          compliance: activity.compliance
        })) as IntervalsActivity[],
        pendingStravaCount
      };
    },
    enabled: true,
  });

  return {
    ...query,
    data: query.data?.activities ?? [],
    pendingStravaCount: query.data?.pendingStravaCount ?? 0,
  };
};
