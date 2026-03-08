import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntervalsEvent } from '@/services/intervalsService';
import { Clock, Zap, ClipboardList, Target, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import WorkoutStructureChart from './WorkoutStructureChart';

interface PlannedWorkoutDialogProps {
  event: IntervalsEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const getSportIcon = (type: string) => {
  const lowerType = (type || '').toLowerCase();
  if (lowerType.includes('ride') || lowerType.includes('cycling') || lowerType.includes('bike')) return '🚴‍♂️';
  if (lowerType.includes('run') || lowerType.includes('running')) return '🏃‍♂️';
  if (lowerType.includes('swim') || lowerType.includes('swimming')) return '🏊‍♂️';
  if (lowerType.includes('hike') || lowerType.includes('walk')) return '🥾';
  if (lowerType.includes('weight') || lowerType.includes('strength')) return '💪';
  if (lowerType.includes('yoga')) return '🧘';
  return '🏃‍♂️';
};

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

interface WorkoutStep {
  duration?: number;
  power?: { value?: number; start?: number; end?: number; units: string };
  cadence?: { value: number };
  ramp?: boolean;
  text?: string;
  steps?: WorkoutStep[];
  reps?: number;
  repeat?: number;
}

const formatPowerTarget = (power: WorkoutStep['power']) => {
  if (!power) return null;
  if (power.value != null && !isNaN(power.value)) {
    if (power.units === '%ftp') return `${power.value}% FTP`;
    if (power.units === 'power_zone') return `Zone ${power.value}`;
    if (power.units === 'W') return `${power.value}W`;
    return `${power.value} ${power.units}`;
  }
  return null;
};

const formatRampTarget = (step: WorkoutStep) => {
  if (!step.ramp || !step.power?.start || !step.power?.end) return null;
  const p = step.power;
  const unitLabel = p.units === '%ftp' ? 'FTP' : p.units === 'power_zone' ? 'Zone' : (p.units || '');
  return `${p.start}% → ${p.end}% ${unitLabel}`;
};

const getZoneColor = (power: WorkoutStep['power']): string => {
  if (!power) return 'bg-muted text-muted-foreground';
  let pct: number | undefined;
  if (power.value != null && !isNaN(power.value)) {
    pct = power.units === '%ftp' ? power.value : undefined;
  } else if (power.start != null) {
    pct = power.units === '%ftp' ? power.start : undefined;
  }
  if (pct == null) return 'bg-muted text-muted-foreground';
  if (pct <= 55) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (pct <= 75) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (pct <= 90) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  if (pct <= 105) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (pct <= 120) return 'bg-red-500/20 text-red-400 border-red-500/30';
  return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
};

const formatStepDuration = (seconds: number | undefined) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) return `${mins}m${secs.toString().padStart(2, '0')}s`;
  if (mins > 0) return `${mins}min`;
  return `${secs}s`;
};

const WorkoutStepRow: React.FC<{ step: WorkoutStep; index: number; depth?: number }> = ({ step, index, depth = 0 }) => {
  // Repeat block
  if (step.repeat && step.steps) {
    return (
      <div className={cn("rounded-lg border border-border/50 overflow-hidden", depth > 0 && "ml-4")}>
        <div className="bg-primary/10 px-3 py-1.5 flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {step.repeat}x
          </Badge>
          <span className="text-xs text-muted-foreground">Répétitions</span>
        </div>
        <div className="p-2 space-y-1">
          {step.steps.map((subStep, i) => (
            <WorkoutStepRow key={i} step={subStep} index={i} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  const powerTarget = formatPowerTarget(step.power);
  const rampTarget = step.ramp && step.ramp.start != null && step.ramp.end != null && !isNaN(step.ramp.start) && !isNaN(step.ramp.end)
    ? `${step.ramp.start}% → ${step.ramp.end}% ${step.ramp.units === '%ftp' ? 'FTP' : step.ramp.units || ''}`
    : null;
  const duration = formatStepDuration(step.duration);
  const zoneColor = getZoneColor(step.power);

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md border",
      zoneColor,
      depth > 0 && "ml-4"
    )}>
      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {duration && (
            <span className="text-sm font-medium">{duration}</span>
          )}
          {powerTarget && (
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              {powerTarget}
            </Badge>
          )}
          {rampTarget && (
            <Badge variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {rampTarget}
            </Badge>
          )}
          {step.cadence && (
            <Badge variant="outline" className="text-xs">
              {step.cadence.value} rpm
            </Badge>
          )}
        </div>
        {step.text && (
          <p className="text-xs text-muted-foreground mt-0.5">{step.text}</p>
        )}
      </div>
    </div>
  );
};

const PlannedWorkoutDialog: React.FC<PlannedWorkoutDialogProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  if (!event) return null;

  const eventDate = parseISO(event.start_date_local);
  const workoutDoc = event.workout_doc;
  const steps: WorkoutStep[] = workoutDoc?.steps || [];
  const isPaired = !!event.paired_activity_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{getSportIcon(event.type)}</span>
            <div className="flex flex-col">
              <span>{event.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {format(eventDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
            </div>
            {isPaired && (
              <Badge variant="secondary" className="ml-auto text-xs">
                ✅ Réalisé
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Target Metrics */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {event.moving_time && event.moving_time > 0 && (
            <Card className="glass-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Durée cible</span>
                </div>
                <p className="text-lg font-bold">{formatDuration(event.moving_time)}</p>
              </CardContent>
            </Card>
          )}
          {event.distance && event.distance > 0 && (
            <Card className="glass-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Distance cible</span>
                </div>
                <p className="text-lg font-bold">{formatDistance(event.distance)}</p>
              </CardContent>
            </Card>
          )}
          {event.icu_training_load && (
            <Card className="glass-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Charge cible</span>
                </div>
                <p className="text-lg font-bold">{Math.round(event.icu_training_load)} TSS</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <Card className="glass-card mt-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Workout Visual Chart */}
        {steps.length > 0 && <WorkoutStructureChart steps={steps} />}

        {/* Workout Structure Details */}
        {steps.length > 0 && (
          <Card className="glass-card mt-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Détail des étapes
                <Badge variant="outline" className="ml-auto text-xs">
                  {steps.reduce((count, s) => count + (s.steps ? s.steps.length : 1), 0)} étapes
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {steps.map((step, i) => (
                <WorkoutStepRow key={i} step={step} index={i} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!event.description && steps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ClipboardList className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Aucun détail disponible pour cet entraînement</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlannedWorkoutDialog;
