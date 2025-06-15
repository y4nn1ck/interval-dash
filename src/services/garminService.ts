
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface GarminAuthData {
  accessToken: string;
  accessTokenSecret: string;
  userId: string;
}

export interface GarminActivity {
  activityId: number;
  activityName: string;
  startTimeLocal: string;
  distance: number;
  duration: number;
  calories: number;
  activityType: string;
}

export interface GarminDailyStats {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  activeMinutes: number;
  restingHeartRate: number;
}

export interface GarminSleepData {
  date: string;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awakeTime: number;
  totalSleep: number;
}

class GarminService {
  private async callSupabaseFunction(functionName: string, data: any) {
    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: data
    });
    
    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
    
    return result;
  }

  async initiateAuth(): Promise<string> {
    try {
      const result = await this.callSupabaseFunction('garmin-auth-init', {});
      return result.authUrl;
    } catch (error) {
      console.error('Error initiating Garmin auth:', error);
      throw new Error('Failed to initiate Garmin authentication');
    }
  }

  async completeAuth(oauthToken: string, oauthVerifier: string): Promise<GarminAuthData> {
    try {
      const result = await this.callSupabaseFunction('garmin-auth-complete', {
        oauthToken,
        oauthVerifier
      });
      
      // Store auth data in Supabase
      const { error } = await supabase
        .from('garmin_auth')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          access_token: result.accessToken,
          access_token_secret: result.accessTokenSecret,
          garmin_user_id: result.userId,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error storing auth data:', error);
      }
      
      return result;
    } catch (error) {
      console.error('Error completing Garmin auth:', error);
      throw new Error('Failed to complete Garmin authentication');
    }
  }

  async getDailyStats(date: string): Promise<GarminDailyStats> {
    try {
      const result = await this.callSupabaseFunction('garmin-daily-stats', { date });
      return result;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw new Error('Failed to fetch daily stats');
    }
  }

  async getActivities(limit: number = 10): Promise<GarminActivity[]> {
    try {
      const result = await this.callSupabaseFunction('garmin-activities', { limit });
      return result;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  async getSleepData(date: string): Promise<GarminSleepData> {
    try {
      const result = await this.callSupabaseFunction('garmin-sleep-data', { date });
      return result;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      throw new Error('Failed to fetch sleep data');
    }
  }

  async getWeeklyStats(): Promise<GarminDailyStats[]> {
    try {
      const result = await this.callSupabaseFunction('garmin-weekly-stats', {});
      return result;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      throw new Error('Failed to fetch weekly stats');
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('garmin_auth')
        .select('access_token')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      return !!data?.access_token;
    } catch (error) {
      return false;
    }
  }

  async syncData(): Promise<void> {
    try {
      await this.callSupabaseFunction('garmin-sync-data', {});
    } catch (error) {
      console.error('Error syncing data:', error);
      throw new Error('Failed to sync Garmin data');
    }
  }
}

export const garminService = new GarminService();
