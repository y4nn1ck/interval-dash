import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIntervalsActivities, useIntervalsEvents } from '@/hooks/useIntervalsData';
import { IntervalsActivity, IntervalsEvent } from '@/services/intervalsService';

interface WeekComplianceData {
  week: string;
  weekLabel: string;
  score: number;
  quality: number;
  completed: number;
  planned: number;
  missed: number;
}

const computeWeekCompliance = (
  activities: IntervalsActivity[],
  events: IntervalsEvent[]
): { score: number; quality: number; completed: number; planned: number; missed: number } => {
  if (events.length === 0) return { score: 0, quality: 0, completed: 0, planned: 0, missed: 0 };

  const pairedEvents = events.filter(e =>
    e.paired_activity_id && activities.some(a => a.id === e.paired_activity_id)
  );
  const missed = events.length - pairedEvents.length;

  const activityScores: number[] = [];
  pairedEvents.forEach(event => {
    const activity = activities.find(a => a.id === event.paired_activity_id);
    if (!activity) return;

    const deviations: number[] = [];
    if (event.moving_time && event.moving_time > 0 && activity.moving_time > 0) {
      deviations.push(Math.abs((activity.moving_time - event.moving_time) / event.moving_time) * 100);
    }
    if (event.distance && event.distance > 0 && activity.distance > 0) {
      deviations.push(Math.abs((activity.distance - event.distance) / event.distance) * 100);
    }
    if (event.icu_training_load && activity.icu_training_load) {
      deviations.push(Math.abs((activity.icu_training_load - event.icu_training_load) / event.icu_training_load) * 100);
    }

    if (deviations.length > 0) {
      activityScores.push(Math.max(0, 100 - deviations.reduce((s, d) => s + d, 0) / deviations.length));
    } else {
      activityScores.push(100);
    }
  });

  const allScores = [...activityScores, ...Array(missed).fill(0)];
  const overallScore = allScores.length > 0
    ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
    : 0;
  const qualityScore = activityScores.length > 0
    ? Math.round(activityScores.reduce((s, v) => s + v, 0) / activityScores.length)
    : 0;

  return {
    score: overallScore,
    quality: qualityScore,
    completed: pairedEvents.length,
    planned: events.length,
    missed,
  };
};

interface ComplianceChartProps {
  currentWeekStart: Date;
}

const NUM_WEEKS = 8;

const ComplianceEvolutionChart: React.FC<ComplianceChartProps> = ({ currentWeekStart }) => {
  // Compute date range for all weeks
  const dateRange = useMemo(() => {
    const oldest = startOfWeek(subWeeks(currentWeekStart, NUM_WEEKS - 1), { weekStartsOn: 1 });
    const newest = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return {
      start: format(oldest, 'yyyy-MM-dd'),
      end: format(newest, 'yyyy-MM-dd'),
    };
  }, [currentWeekStart]);

  const { data: allActivities = [], isLoading: loadingActivities } = useIntervalsActivities(dateRange.start, dateRange.end);
  const { data: allEvents = [], isLoading: loadingEvents } = useIntervalsEvents(dateRange.start, dateRange.end);

  const chartData = useMemo(() => {
    const weeks: WeekComplianceData[] = [];

    for (let i = NUM_WEEKS - 1; i >= 0; i--) {
      const ws = startOfWeek(subWeeks(currentWeekStart, i), { weekStartsOn: 1 });
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const wsStr = format(ws, 'yyyy-MM-dd');
      const weStr = format(we, 'yyyy-MM-dd');

      const weekActivities = allActivities.filter(a => {
        const d = a.start_date_local.split('T')[0];
        return d >= wsStr && d <= weStr;
      });
      const weekEvents = allEvents.filter(e => {
        const d = e.start_date_local.split('T')[0];
        return d >= wsStr && d <= weStr;
      });

      const compliance = computeWeekCompliance(weekActivities, weekEvents);

      weeks.push({
        week: wsStr,
        weekLabel: format(ws, 'dd MMM', { locale: fr }),
        ...compliance,
      });
    }

    return weeks;
  }, [allActivities, allEvents, currentWeekStart]);

  // Only show if there's at least one week with planned events
  const hasData = chartData.some(w => w.planned > 0);
  if (!hasData && !loadingActivities && !loadingEvents) return null;

  const chartConfig = {
    score: {
      label: 'Score global',
      color: '#10b981',
    },
    quality: {
      label: "Qualité d'exécution",
      color: '#3b82f6',
    },
    completed: {
      label: 'Séances réalisées',
      color: '#8b5cf6',
    },
    planned: {
      label: 'Séances prévues',
      color: '#6b7280',
    },
  };

  return (
    <Card className="glass-card opacity-0 animate-fade-in-up-delay-3">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Évolution de la compliance ({NUM_WEEKS} semaines)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi de l'adhérence au plan d'entraînement : score global (séances manquées = 0%) et qualité d'exécution (écart durée/distance/TSS des séances réalisées).
        </p>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-[3px] rounded-full" style={{ backgroundColor: '#10b981' }} />
            <span className="text-muted-foreground">Score global (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-[3px] rounded-full border-b-2 border-dashed" style={{ borderColor: '#3b82f6', height: 0 }} />
            <span className="text-muted-foreground">Qualité d'exécution (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--muted-foreground))', opacity: 0.15 }} />
            <span className="text-muted-foreground">Séances prévues</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#8b5cf6', opacity: 0.5 }} />
            <span className="text-muted-foreground">Séances réalisées</span>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="compScoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compQualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <filter id="compGlow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis
                dataKey="weekLabel"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="percent"
                domain={[0, 100]}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v}%`}
                label={{ value: 'Compliance %', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
                label={{ value: 'Nb séances', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="bg-card/95 backdrop-blur-xl border-border shadow-xl"
                    formatter={(value, name) => {
                      if (name === 'score') return [`${value}%`, 'Score global'];
                      if (name === 'quality') return [`${value}%`, "Qualité d'exécution"];
                      if (name === 'completed') return [`${value}`, 'Séances réalisées'];
                      if (name === 'planned') return [`${value}`, 'Séances prévues'];
                      return [value, undefined];
                    }}
                  />
                }
                labelFormatter={(label) => `Semaine du ${label}`}
              />
              {/* Area under score line */}
              <Area
                yAxisId="percent"
                type="basis"
                dataKey="score"
                fill="url(#compScoreGrad)"
                stroke="none"
              />
              <Area
                yAxisId="percent"
                type="basis"
                dataKey="quality"
                fill="url(#compQualityGrad)"
                stroke="none"
              />
              {/* Bars for completed / planned */}
              <Bar
                yAxisId="count"
                dataKey="planned"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.15}
                radius={[4, 4, 0, 0]}
                barSize={16}
                name="planned"
              />
              <Bar
                yAxisId="count"
                dataKey="completed"
                fill="#8b5cf6"
                fillOpacity={0.5}
                radius={[4, 4, 0, 0]}
                barSize={16}
                name="completed"
              />
              {/* Lines */}
              <Line
                yAxisId="percent"
                type="basis"
                dataKey="score"
                stroke="var(--color-score)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--color-score)', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                activeDot={{ r: 6, stroke: 'var(--color-score)', strokeWidth: 2, fill: 'hsl(var(--card))' }}
                filter="url(#compGlow)"
                connectNulls
                name="score"
              />
              <Line
                yAxisId="percent"
                type="basis"
                dataKey="quality"
                stroke="var(--color-quality)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: 'var(--color-quality)', strokeWidth: 1.5, stroke: 'hsl(var(--card))' }}
                activeDot={{ r: 5, stroke: 'var(--color-quality)', strokeWidth: 2, fill: 'hsl(var(--card))' }}
                connectNulls
                name="quality"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ComplianceEvolutionChart;
