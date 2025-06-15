
-- Create table for storing Garmin authentication data
CREATE TABLE garmin_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  access_token_secret TEXT NOT NULL,
  garmin_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create table for storing daily stats
CREATE TABLE garmin_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  distance DECIMAL,
  calories INTEGER,
  active_minutes INTEGER,
  resting_heart_rate INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create table for storing activities
CREATE TABLE garmin_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id BIGINT NOT NULL,
  activity_name TEXT,
  start_time_local TIMESTAMP WITH TIME ZONE,
  distance DECIMAL,
  duration INTEGER,
  calories INTEGER,
  activity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- Create table for storing sleep data
CREATE TABLE garmin_sleep_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  deep_sleep INTEGER,
  light_sleep INTEGER,
  rem_sleep INTEGER,
  awake_time INTEGER,
  total_sleep INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE garmin_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE garmin_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE garmin_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE garmin_sleep_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own garmin auth" ON garmin_auth
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own garmin auth" ON garmin_auth
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own garmin auth" ON garmin_auth
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily stats" ON garmin_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats" ON garmin_daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats" ON garmin_daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities" ON garmin_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON garmin_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sleep data" ON garmin_sleep_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep data" ON garmin_sleep_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep data" ON garmin_sleep_data
  FOR UPDATE USING (auth.uid() = user_id);
