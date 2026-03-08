CREATE TABLE public.upcoming_races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  race_date date NOT NULL,
  race_type text NOT NULL DEFAULT 'running',
  distance text NOT NULL,
  priority text NOT NULL DEFAULT 'B',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.upcoming_races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to upcoming_races" ON public.upcoming_races FOR ALL USING (true) WITH CHECK (true);