import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntervalsActivity, IntervalsEvent } from '@/services/intervalsService';
import { Clock, Activity, Zap, GitCompareArrows, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import WorkoutStructureChart from './WorkoutStructureChart';

interface PlannedVsRealizedProps {
  activity: IntervalsActivity;
  plannedEvent: IntervalsEvent;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h${minutes.toString().padStart(2, '0')}`;
  return `${minutes}min`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

interface ComparisonRow {
  label: string;
  icon: React.ReactNode;
  planned: string | null;
  realized: string | null;
  deviationPct: number | null;
}

const DeviationBadge: React.FC<{ pct: number | null }> = ({ pct }) => {
  if (pct === null) return null;
  const absPct = Math.abs(pct);
  const color = absPct <= 10
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : absPct <= 25
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';

  const Icon = pct > 5 ? ArrowUp : pct < -5 ? ArrowDown : Minus;

  return (
    <Badge variant="outline" className={cn('text-xs gap-1 border', color)}>
      <Icon className="h-3 w-3" />
      {pct > 0 ? '+' : ''}{Math.round(pct)}%
    </Badge>
  );
};

const PlannedVsRealized: React.FC<PlannedVsRealizedProps> = ({ activity, plannedEvent }) => {
  const { rows, overallScore } = useMemo(() => {
    const comparisons: ComparisonRow[] = [];
    const deviations: number[] = [];

    // Duration
    if (plannedEvent.moving_time && plannedEvent.moving_time > 0 && activity.moving_time > 0) {
      const dev = ((activity.moving_time - plannedEvent.moving_time) / plannedEvent.moving_time) * 100;
      deviations.push(Math.abs(dev));
      comparisons.push({
        label: 'Durée',
        icon: <Clock className="h-4 w-4 text-primary" />,
        planned: formatDuration(plannedEvent.moving_time),
        realized: formatDuration(activity.moving_time),
        deviationPct: dev,
      });
    }

    // Distance
    if (plannedEvent.distance && plannedEvent.distance > 0 && activity.distance > 0) {
      const dev = ((activity.distance - plannedEvent.distance) / plannedEvent.distance) * 100;
      deviations.push(Math.abs(dev));
      comparisons.push({
        label: 'Distance',
        icon: <Activity className="h-4 w-4 text-primary" />,
        planned: formatDistance(plannedEvent.distance),
        realized: formatDistance(activity.distance),
        deviationPct: dev,
      });
    }

    // TSS
    if (plannedEvent.icu_training_load && activity.icu_training_load) {
      const dev = ((activity.icu_training_load - plannedEvent.icu_training_load) / plannedEvent.icu_training_load) * 100;
      deviations.push(Math.abs(dev));
      comparisons.push({
        label: 'Charge (TSS)',
        icon: <Zap className="h-4 w-4 text-primary" />,
        planned: `${Math.round(plannedEvent.icu_training_load)}`,
        realized: `${Math.round(activity.icu_training_load)}`,
        deviationPct: dev,
      });
    }

    const avgDev = deviations.length > 0
      ? deviations.reduce((s, v) => s + v, 0) / deviations.length
      : null;
    const score = avgDev !== null ? Math.max(0, Math.round(100 - avgDev)) : null;

    return { rows: comparisons, overallScore: score };
  }, [activity, plannedEvent]);

  const steps = plannedEvent.workout_doc?.steps || [];
  const scoreColor = overallScore !== null
    ? overallScore >= 90 ? 'text-green-400' : overallScore >= 75 ? 'text-yellow-400' : 'text-red-400'
    : '';

  return (
    <Card className="glass-card mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          Planifié vs Réalisé
          {overallScore !== null && (
            <Badge variant="outline" className={cn('ml-auto text-sm font-bold border', scoreColor)}>
              {overallScore}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-3 p-2 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 min-w-[100px]">
                  {row.icon}
                  <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground block">Planifié</span>
                  <span className="text-sm font-semibold text-primary/80">{row.planned}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground block">Réalisé</span>
                  <span className="text-sm font-semibold">{row.realized}</span>
                </div>
                <div className="flex justify-center">
                  <DeviationBadge pct={row.deviationPct} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            Pas assez de données pour comparer
          </p>
        )}

        {/* Planned workout structure chart */}
        {steps.length > 0 && (
          <div className="mt-3">
            <WorkoutStructureChart steps={steps} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlannedVsRealized;
