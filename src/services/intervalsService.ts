export interface IntervalsActivity {
  id: string;
  start_date_local: string;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  calories: number;
  icu_rpe?: number;
  feel?: number;
  carbs_ingested?: number;
  icu_training_load?: number;
  icu_weighted_avg_watts?: number;
  icu_average_watts?: number;
}

export interface IntervalsDailyStats {
  date: string;
  training_load: number;
  hrv_rmssd: number;
  resting_hr: number;
  weight: number;
  sleep_secs: number;
  steps: number;
  calories: number;
  ctl?: number;
  atl?: number;
  tsb?: number;
  hydration?: number;
}

class IntervalsService {
  private baseUrl = 'https://intervals.icu/api/v1';

  async checkAuth(): Promise<boolean> {
    try {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      return !!(apiKey && athleteId);
    } catch (error) {
      console.error('Error checking Intervals.icu auth:', error);
      return false;
    }
  }

  async saveApiKey(credentials: { apiKey: string; athleteId: string }): Promise<void> {
    console.log('Testing API key with Intervals.icu...');
    
    // Test the API key by making a request to get specific athlete info
    // Use "API_KEY" as username and the actual API key as password
    const authHeader = `Basic ${btoa(`API_KEY:${credentials.apiKey}`)}`;
    console.log('Authorization header created (first 20 chars):', authHeader.substring(0, 20) + '...');
    console.log('Testing with athlete ID:', credentials.athleteId);
    
    const testResponse = await fetch(`${this.baseUrl}/athlete/${credentials.athleteId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', testResponse.status);
    console.log('Response headers:', Object.fromEntries(testResponse.headers.entries()));

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('API Error Response:', errorText);
      
      // Provide specific error messages based on status code
      if (testResponse.status === 403) {
        throw new Error('Access denied. Please check that your API Key and Athlete ID are correct. You can find your API Key in the Developer section of your Intervals.icu settings, and your Athlete ID in your profile URL (e.g., intervals.icu/athletes/YOUR_ATHLETE_ID). If the issue persists, try generating a new API key.');
      } else if (testResponse.status === 401) {
        throw new Error('Authentication failed. Please verify your API Key is correct and has not expired.');
      } else if (testResponse.status === 404) {
        throw new Error('Athlete not found. Please verify your Athlete ID is correct.');
      } else {
        throw new Error(`Connection failed (${testResponse.status}): ${errorText || testResponse.statusText}`);
      }
    }

    const athleteData = await testResponse.json();
    console.log('Athlete data received:', athleteData);
    
    localStorage.setItem('intervals_api_key', credentials.apiKey);
    localStorage.setItem('intervals_athlete_id', credentials.athleteId);
    localStorage.setItem('intervals_athlete_name', athleteData.name || 'Unknown');
  }

  private async makeAuthenticatedRequest(endpoint: string) {
    const apiKey = localStorage.getItem('intervals_api_key');
    if (!apiKey) {
      throw new Error('No API key found');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getDailyStats(date: string): Promise<IntervalsDailyStats | null> {
    try {
      const athleteId = localStorage.getItem('intervals_athlete_id');
      if (!athleteId) return null;

      console.log(`Fetching wellness data for ${date} from Intervals.icu...`);
      const data = await this.makeAuthenticatedRequest(`/athlete/${athleteId}/wellness/${date}`);
      console.log('Wellness data received:', data);
      
      return {
        date: date,
        training_load: data.ctl || 0,
        hrv_rmssd: data.hrvRmssd || data.hrv || 0,
        resting_hr: data.restingHR || 0,
        weight: data.weight || 0,
        sleep_secs: data.sleepSecs || 0,
        steps: data.steps || 0,
        calories: data.calories || 0,
        ctl: data.ctl || 0,
        atl: data.atl || 0,
        tsb: data.ctl && data.atl ? data.ctl - data.atl : 0,
        hydration: data.hydration || null
      };
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return null;
    }
  }

  async getWeeklyStats(): Promise<IntervalsDailyStats[]> {
    try {
      const athleteId = localStorage.getItem('intervals_athlete_id');
      if (!athleteId) return [];

      const endDate = new Date();
      const results: IntervalsDailyStats[] = [];

      // Fetch individual daily data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          console.log(`Fetching wellness data for ${dateStr}...`);
          const data = await this.makeAuthenticatedRequest(`/athlete/${athleteId}/wellness/${dateStr}`);
          console.log(`Wellness data for ${dateStr}:`, data);
          
          results.push({
            date: dateStr,
            training_load: data.ctl || 0,
            hrv_rmssd: data.hrvRmssd || data.hrv || 0,
            resting_hr: data.restingHR || 0,
            weight: data.weight || 0,
            sleep_secs: data.sleepSecs || 0,
            steps: data.steps || 0,
            calories: data.calories || 0,
            ctl: data.ctl || 0,
            atl: data.atl || 0,
            tsb: data.ctl && data.atl ? data.ctl - data.atl : 0,
            hydration: data.hydration || null
          });
        } catch (error) {
          console.error(`Error fetching wellness data for ${dateStr}:`, error);
          // Add placeholder data if API call fails
          results.push({
            date: dateStr,
            training_load: 0,
            hrv_rmssd: 0,
            resting_hr: 0,
            weight: 0,
            sleep_secs: 0,
            steps: 0,
            calories: 0,
            ctl: 0,
            atl: 0,
            tsb: 0,
            hydration: null
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return [];
    }
  }

  async getMonthlyStats(): Promise<IntervalsDailyStats[]> {
    try {
      const athleteId = localStorage.getItem('intervals_athlete_id');
      if (!athleteId) return [];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log(`Fetching monthly wellness data from ${startDateStr} to ${endDateStr}...`);
      const data = await this.makeAuthenticatedRequest(`/athlete/${athleteId}/wellness/${startDateStr}/${endDateStr}`);
      console.log('Monthly wellness data received:', data);
      
      return data.map((item: any) => ({
        date: item.id,
        training_load: item.ctl || 0,
        hrv_rmssd: item.hrvRmssd || item.hrv || 0,
        resting_hr: item.restingHR || 0,
        weight: item.weight || 0,
        sleep_secs: item.sleepSecs || 0,
        steps: item.steps || 0,
        calories: item.calories || 0,
        ctl: item.ctl || 0,
        atl: item.atl || 0,
        tsb: item.ctl && item.atl ? item.ctl - item.atl : 0,
        hydration: item.hydration || null
      }));
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return [];
    }
  }

  async getActivities(startDate: string, endDate: string): Promise<IntervalsActivity[]> {
    try {
      const athleteId = localStorage.getItem('intervals_athlete_id');
      if (!athleteId) return [];

      console.log(`Fetching activities from ${startDate} to ${endDate}...`);
      const data = await this.makeAuthenticatedRequest(`/athlete/${athleteId}/activities?oldest=${startDate}&newest=${endDate}`);
      console.log('Activities received:', data);
      
      return data.map((activity: any) => ({
        id: activity.id,
        start_date_local: activity.start_date_local,
        name: activity.name || 'Sans nom',
        type: activity.type || 'Unknown',
        distance: activity.distance || 0,
        moving_time: activity.moving_time || 0,
        total_elevation_gain: activity.total_elevation_gain || 0,
        calories: activity.calories || 0,
        icu_rpe: activity.icu_rpe,
        feel: activity.feel,
        carbs_ingested: activity.carbs_ingested,
        icu_training_load: activity.icu_training_load,
        icu_weighted_avg_watts: activity.icu_weighted_avg_watts,
        icu_average_watts: activity.icu_average_watts,
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async getActivityFitFile(activityId: string): Promise<ArrayBuffer | null> {
    try {
      const apiKey = localStorage.getItem('intervals_api_key');
      const athleteId = localStorage.getItem('intervals_athlete_id');
      if (!apiKey || !athleteId) return null;

      console.log(`Fetching FIT file for activity ${activityId}...`);
      const response = await fetch(`${this.baseUrl}/activity/${activityId}/fit-file`, {
        headers: {
          'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch FIT file: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error fetching activity FIT file:', error);
      return null;
    }
  }

  async syncData(): Promise<void> {
    // For now, this is a no-op since we're fetching data directly
    console.log('Data sync completed');
  }
}

export const intervalsService = new IntervalsService();