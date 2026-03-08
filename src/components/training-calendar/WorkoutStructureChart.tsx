import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface WorkoutStep {
  duration?: number;
  power?: { value?: number; start?: number; end?: number; units: string };
  hr?: any;
  cadence?: any;
  ramp?: boolean;
  text?: string;
  steps?: WorkoutStep[];
  reps?: number;
  repeat?: number;
  distance?: number;
}

interface FlatStep {
  startTime: number;
  duration: number;
  power: number;
  powerEnd?: number;
  label: string;
  isRamp: boolean;
}

const ZONE_COLORS = [
  { max: 55, color: '#6B7280', label: 'Z1 Récup' },
  { max: 75, color: '#3B82F6', label: 'Z2 Endurance' },
  { max: 90, color: '#22C55E', label: 'Z3 Tempo' },
  { max: 105, color: '#EAB308', label: 'Z4 Seuil' },
  { max: 120, color: '#F97316', label: 'Z5 VO2max' },
  { max: 150, color: '#EF4444', label: 'Z6 Anaérobie' },
  { max: Infinity, color: '#A855F7', label: 'Z7 Sprint' },
];

const getZoneColorHex = (pct: number): string => {
  for (const zone of ZONE_COLORS) {
    if (pct <= zone.max) return zone.color;
  }
  return ZONE_COLORS[ZONE_COLORS.length - 1].color;
};

// Convert power zone numbers to approximate %FTP
const powerZoneToFtp = (zone: number): number => {
  const map: Record<number, number> = { 1: 50, 2: 68, 3: 83, 4: 97, 5: 112, 6: 135, 7: 160 };
  return map[zone] || 50;
};

const extractPower = (step: WorkoutStep): { power: number; powerEnd?: number; isRamp: boolean; label: string } => {
  const p = step.power;
  if (!p) return { power: 50, isRamp: false, label: step.text || '' };

  const isRamp = !!step.ramp;

  if (isRamp && p.start != null && p.end != null && !isNaN(p.start) && !isNaN(p.end)) {
    if (p.units === '%ftp') {
      return { power: p.start, powerEnd: p.end, isRamp: true, label: `${p.start}→${p.end}%` };
    }
    if (p.units === 'power_zone') {
      const s = powerZoneToFtp(p.start);
      const e = powerZoneToFtp(p.end);
      return { power: s, powerEnd: e, isRamp: true, label: `Z${p.start}→Z${p.end}` };
    }
    return { power: p.start, powerEnd: p.end, isRamp: true, label: `${p.start}→${p.end}` };
  }

  if (p.value != null && !isNaN(p.value)) {
    if (p.units === '%ftp') return { power: p.value, isRamp: false, label: `${p.value}%` };
    if (p.units === 'power_zone') {
      const pct = powerZoneToFtp(p.value);
      return { power: pct, isRamp: false, label: `Z${p.value}` };
    }
    return { power: p.value, isRamp: false, label: `${p.value}W` };
  }

  return { power: 50, isRamp: false, label: step.text || '' };
};

const flattenSteps = (steps: WorkoutStep[], startTime = 0): FlatStep[] => {
  const flat: FlatStep[] = [];
  let currentTime = startTime;

  for (const step of steps) {
    const reps = step.reps || step.repeat;
    if (reps && step.steps) {
      for (let r = 0; r < reps; r++) {
        const inner = flattenSteps(step.steps, currentTime);
        flat.push(...inner);
        currentTime = inner.length > 0 ? inner[inner.length - 1].startTime + inner[inner.length - 1].duration : currentTime;
      }
    } else {
      const dur = step.duration && step.duration > 0 ? step.duration : 60;
      const { power, powerEnd, isRamp, label } = extractPower(step);
      flat.push({ startTime: currentTime, duration: dur, power, powerEnd, label, isRamp });
      currentTime += dur;
    }
  }

  return flat;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}'`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h${remMins.toString().padStart(2, '0')}`;
};

interface WorkoutStructureChartProps {
  steps: WorkoutStep[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-foreground">{data.label || 'Step'}</p>
      <p className="text-muted-foreground">
        {formatTime(data.startTime)} → {formatTime(data.startTime + data.duration)}
      </p>
      <p className="text-muted-foreground">
        Durée: {data.duration >= 60 ? `${Math.floor(data.duration / 60)}min${data.duration % 60 > 0 ? `${data.duration % 60}s` : ''}` : `${data.duration}s`}
      </p>
    </div>
  );
};

const WorkoutStructureChart: React.FC<WorkoutStructureChartProps> = ({ steps }) => {
  const { chartData, rampSegments } = useMemo(() => {
    const flatSteps = flattenSteps(steps);
    if (flatSteps.length === 0) return { chartData: [], rampSegments: [] };

    const RESOLUTION = 5; // seconds per bar segment
    const totalDuration = flatSteps[flatSteps.length - 1].startTime + flatSteps[flatSteps.length - 1].duration;
    const data: Array<{ time: number; power: number; color: string; startTime: number; duration: number; label: string }> = [];
    const ramps: typeof data = [];

    for (const step of flatSteps) {
      // For ramps, interpolate; for normal steps, constant power
      const numSegments = Math.max(1, Math.round(step.duration / RESOLUTION));
      const segDuration = step.duration / numSegments;

      for (let s = 0; s < numSegments; s++) {
        let power: number;
        if (step.isRamp && step.powerEnd !== undefined) {
          const progress = numSegments > 1 ? s / (numSegments - 1) : 0;
          power = step.power + (step.powerEnd - step.power) * progress;
        } else {
          power = step.power;
        }

        const segStart = step.startTime + s * segDuration;
        const entry = {
          time: segStart,
          power: Math.round(power),
          color: getZoneColorHex(power),
          startTime: step.startTime,
          duration: step.duration,
          label: step.label,
        };
        data.push(entry);
        if (step.isRamp) ramps.push(entry);
      }
    }

    return { chartData: data, rampSegments: ramps };
  }, [steps]);

  const maxPower = Math.max(...(chartData.length > 0 ? chartData.map(d => d.power) : [100]), 100);
  const usedZones = useMemo(() => {
    const zones = new Set<string>();
    chartData.forEach(d => {
      for (const zone of ZONE_COLORS) {
        if (d.power <= zone.max) {
          zones.add(zone.label);
          break;
        }
      }
    });
    return ZONE_COLORS.filter(z => zones.has(z.label));
  }, [chartData]);

  if (chartData.length === 0) return null;

  return (
    <Card className="glass-card mt-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Profil du workout
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={0} barGap={0}>
              <defs>
                <filter id="workoutGlow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <XAxis
                dataKey="time"
                type="number"
                domain={[0, 'dataMax']}
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, Math.ceil(maxPower / 10) * 10 + 10]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Bar dataKey="power" radius={[1, 1, 0, 0]} filter="url(#workoutGlow)" isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Zone Legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {usedZones.map((zone) => (
            <div key={zone.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: zone.color, opacity: 0.85 }}
              />
              <span className="text-[10px] text-muted-foreground">{zone.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutStructureChart;
