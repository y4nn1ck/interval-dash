
-- Create table for storing Intervals.icu authentication data
CREATE TABLE intervals_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  athlete_id TEXT NOT NULL,
  athlete_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create table for storing daily wellness data
CREATE TABLE intervals_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  training_load INTEGER,
  hrv_rmssd INTEGER,
  resting_hr INTEGER,
  weight DECIMAL,
  sleep_secs INTEGER,
  steps INTEGER,
  calories INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create table for storing activities
CREATE TABLE intervals_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  name TEXT,
  start_date_local TIMESTAMP WITH TIME ZONE,
  type TEXT,
  distance DECIMAL,
  moving_time INTEGER,
  total_elevation_gain DECIMAL,
  calories INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- Enable RLS
ALTER TABLE intervals_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervals_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervals_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own intervals auth" ON intervals_auth
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intervals auth" ON intervals_auth
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intervals auth" ON intervals_auth
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily stats" ON intervals_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats" ON intervals_daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats" ON intervals_daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities" ON intervals_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON intervals_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
