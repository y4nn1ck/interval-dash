
CREATE TABLE public.race_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  race_type TEXT NOT NULL DEFAULT 'running',
  distance TEXT NOT NULL,
  official_time_seconds INTEGER NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_id TEXT,
  activity_time_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to race_results" ON public.race_results
  FOR ALL USING (true) WITH CHECK (true);
