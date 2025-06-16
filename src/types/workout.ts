
export interface IntervalsActivity {
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
  compliance?: number;
}
