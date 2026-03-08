import React from 'react';
import { IntervalsActivity, IntervalsEvent } from '@/services/intervalsService';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ComplianceIndicatorProps {
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
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
};

const getDeviationIcon = (percent: number) => {
  if (percent > 10) return <ArrowUp className="h-2.5 w-2.5" />;
  if (percent < -10) return <ArrowDown className="h-2.5 w-2.5" />;
  return <Minus className="h-2.5 w-2.5" />;
};

const getDeviationColor = (percent: number) => {
  const abs = Math.abs(percent);
  if (abs <= 10) return 'text-green-500';
  if (abs <= 25) return 'text-yellow-500';
  return 'text-red-400';
};

const ComplianceIndicator: React.FC<ComplianceIndicatorProps> = ({ activity, plannedEvent }) => {
  const metrics: { label: string; planned: number; actual: number; unit: string; format?: (v: number) => string }[] = [];

  // Duration comparison
  if (plannedEvent.moving_time && plannedEvent.moving_time > 0 && activity.moving_time > 0) {
    metrics.push({
      label: 'Durée',
      planned: plannedEvent.moving_time,
      actual: activity.moving_time,
      unit: '',
      format: formatDuration,
    });
  }

  // Distance comparison
  if (plannedEvent.distance && plannedEvent.distance > 0 && activity.distance > 0) {
    metrics.push({
      label: 'Distance',
      planned: plannedEvent.distance,
      actual: activity.distance,
      unit: '',
      format: formatDistance,
    });
  }

  // TSS comparison
  if (plannedEvent.icu_training_load && activity.icu_training_load) {
    metrics.push({
      label: 'TSS',
      planned: plannedEvent.icu_training_load,
      actual: activity.icu_training_load,
      unit: '',
    });
  }

  if (metrics.length === 0) return null;

  // Overall compliance score (average of all metric deviations)
  const deviations = metrics.map(m => {
    if (m.planned === 0) return 0;
    return ((m.actual - m.planned) / m.planned) * 100;
  });
  const avgAbsDeviation = deviations.reduce((sum, d) => sum + Math.abs(d), 0) / deviations.length;

  const overallColor = avgAbsDeviation <= 10
    ? 'bg-green-500/20 border-green-500/40 text-green-500'
    : avgAbsDeviation <= 25
      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500'
      : 'bg-red-400/20 border-red-400/40 text-red-400';

  const overallIcon = avgAbsDeviation <= 10
    ? <CheckCircle className="h-3 w-3" />
    : <AlertTriangle className="h-3 w-3" />;

  const compliancePercent = Math.max(0, Math.round(100 - avgAbsDeviation));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold cursor-help",
            overallColor
          )}>
            {overallIcon}
            {compliancePercent}%
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-foreground">Compliance: {compliancePercent}%</p>
            <div className="space-y-1">
              {metrics.map((m, i) => {
                const dev = deviations[i];
                const devColor = getDeviationColor(dev);
                return (
                  <div key={m.label} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{m.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">
                        {m.format ? m.format(m.planned) : Math.round(m.planned)}
                      </span>
                      <span className="text-foreground">→</span>
                      <span className="font-medium text-foreground">
                        {m.format ? m.format(m.actual) : Math.round(m.actual)}
                      </span>
                      <span className={cn("flex items-center gap-0.5 font-medium", devColor)}>
                        {getDeviationIcon(dev)}
                        {dev > 0 ? '+' : ''}{Math.round(dev)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ComplianceIndicator;
