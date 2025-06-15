
import { supabase } from '@/integrations/supabase/client';

export interface IntervalsActivity {
  id: string;
  start_date_local: string;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  calories: number;
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
}

class IntervalsService {
  private baseUrl = 'https://intervals.icu/api/v1';

  async checkAuth(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('intervals_auth')
        .select('api_key')
        .eq('user_id', user.id)
        .single();

      return !!data?.api_key;
    } catch (error) {
      console.error('Error checking Intervals.icu auth:', error);
      return false;
    }
  }

  async saveApiKey(apiKey: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Test the API key first
    const testResponse = await fetch(`${this.baseUrl}/athlete`, {
      headers: {
        'Authorization': `Basic ${btoa(`API_KEY:${apiKey}`)}`
      }
    });

    if (!testResponse.ok) {
      throw new Error('Invalid API key');
    }

    const athleteData = await testResponse.json();

    await supabase
      .from('intervals_auth')
      .upsert({
        user_id: user.id,
        api_key: apiKey,
        athlete_id: athleteData.id,
        athlete_name: athleteData.name
      });
  }

  async getDailyStats(date: string): Promise<IntervalsDailyStats | null> {
    const { data, error } = await supabase.functions.invoke('intervals-daily-stats', {
      body: { date }
    });

    if (error) throw error;
    return data;
  }

  async getWeeklyStats(): Promise<IntervalsDailyStats[]> {
    const { data, error } = await supabase.functions.invoke('intervals-weekly-stats');
    if (error) throw error;
    return data || [];
  }

  async syncData(): Promise<void> {
    const { error } = await supabase.functions.invoke('intervals-sync-data');
    if (error) throw error;
  }
}

export const intervalsService = new IntervalsService();
