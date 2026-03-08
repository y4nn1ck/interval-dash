import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Timer, MapPin, Zap } from 'lucide-react';
import { IntervalsActivity } from '@/services/intervalsService';

interface SportDistributionChartProps {
  activities: IntervalsActivity[];
  viewMode?: 'week' | 'month';
}

const SPORT_COLORS: Record<string, string> = {
  Run: 'hsl(15, 90%, 55%)',
  VirtualRide: 'hsl(152, 70%, 40%)',
  Ride: 'hsl(142, 70%, 50%)',
  Swim: 'hsl(210, 80%, 55%)',
  Hike: 'hsl(35, 70%, 50%)',
  Walk: 'hsl(35, 70%, 50%)',
  WeightTraining: 'hsl(280, 60%, 55%)',
  Yoga: 'hsl(180, 50%, 50%)',
};

const getSportEmoji = (type: string) => {
  const lt = (type || '').toLowerCase();
  if (lt.includes('virtualride')) return '🚴‍♂️';
  if (lt.includes('ride') || lt.includes('cycling') || lt.includes('bike')) return '🚴‍♂️';
  if (lt.includes('run') || lt.includes('running')) return '🏃‍♂️';
  if (lt.includes('swim') || lt.includes('swimming')) return '🏊‍♂️';
  if (lt.includes('hike') || lt.includes('walk')) return '🥾';
  if (lt.includes('weight') || lt.includes('strength')) return '💪';
  if (lt.includes('yoga')) return '🧘';
  return '🏃‍♂️';
};

const getSportLabel = (type: string) => {
  const lt = (type || '').toLowerCase();
  if (lt.includes('virtualride')) return 'HT Vélo';
  if (lt.includes('ride') || lt.includes('cycling') || lt.includes('bike')) return 'Vélo';
  if (lt.includes('run') || lt.includes('running')) return 'Course';
  if (lt.includes('swim') || lt.includes('swimming')) return 'Natation';
  if (lt.includes('hike') || lt.includes('walk')) return 'Rando';
  if (lt.includes('weight') || lt.includes('strength')) return 'Renfo';
  if (lt.includes('yoga')) return 'Yoga';
  return type;
};

const getSportColor = (type: string) => {
  return SPORT_COLORS[type] || `hsl(${Math.abs(type.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360}, 60%, 55%)`;
};

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

const CustomTooltip = ({ active, payload, type }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const formatted = type === 'time'
    ? formatDuration(data.value)
    : type === 'distance'
      ? formatDistance(data.value)
      : `${Math.round(data.value)} TSS`;
  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 text-xs shadow-2xl">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color, boxShadow: `0 0 8px ${data.color}60` }} />
        <p className="font-semibold text-foreground">{data.label}</p>
      </div>
      <p className="text-muted-foreground pl-5">{formatted} <span className="font-bold text-foreground">({data.percent}%)</span></p>
    </div>
  );
};

interface DonutSectionProps {
  data: { name: string; label: string; value: number; percent: number; color: string }[];
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tooltipType: string;
  accentColor: string;
}

const DonutSection = ({ data, icon, title, subtitle, tooltipType, accentColor }: DonutSectionProps) => {
  // Center label: show top sport %
  const topEntry = data[0];

  return (
    <div className="relative group">
      {/* Subtle glow behind chart */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl -z-10"
        style={{ background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)` }}
      />

      <div className="metric-card rounded-2xl p-4 transition-all duration-300 group-hover:shadow-lg" style={{ borderColor: `${accentColor}20` }}>
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${accentColor}15` }}>
            {icon}
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{title}</p>
            <p className="text-sm font-bold text-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Donut */}
        <div className="h-[170px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {data.map((entry) => (
                  <filter key={`glow-${entry.name}`} id={`glow-${tooltipType}-${entry.name}`}>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                strokeWidth={0}
                cornerRadius={4}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    style={{ filter: `drop-shadow(0 0 4px ${entry.color}40)` }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip type={tooltipType} />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          {topEntry && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg">{getSportEmoji(topEntry.name)}</span>
              <span className="text-lg font-black text-foreground leading-none">{topEntry.percent}%</span>
              <span className="text-[9px] text-muted-foreground">{topEntry.label}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}50` }}
              />
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-bold text-foreground">{d.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SportDistributionChart = ({ activities, viewMode = 'week' }: SportDistributionChartProps) => {
  const periodLabel = viewMode === 'month' ? 'du mois' : 'de la semaine';

  const { timeData, distanceData, loadData } = useMemo(() => {
    const grouped: Record<string, { time: number; distance: number; load: number }> = {};
    activities.forEach((a) => {
      const key = a.type || 'Other';
      if (!grouped[key]) grouped[key] = { time: 0, distance: 0, load: 0 };
      grouped[key].time += a.moving_time || 0;
      grouped[key].distance += a.distance || 0;
      grouped[key].load += a.icu_training_load || 0;
    });

    const build = (field: 'time' | 'distance' | 'load') => {
      const total = Object.values(grouped).reduce((s, v) => s + v[field], 0);
      return Object.entries(grouped)
        .filter(([, v]) => v[field] > 0)
        .map(([type, v]) => ({
          name: type,
          label: getSportLabel(type),
          value: v[field],
          percent: total > 0 ? Math.round((v[field] / total) * 100) : 0,
          color: getSportColor(type),
        }))
        .sort((a, b) => b.value - a.value);
    };

    return { timeData: build('time'), distanceData: build('distance'), loadData: build('load') };
  }, [activities]);

  if (activities.length === 0 || timeData.length < 2) return null;

  const totalTime = timeData.reduce((s, d) => s + d.value, 0);
  const totalDist = distanceData.reduce((s, d) => s + d.value, 0);
  const totalLoad = loadData.reduce((s, d) => s + d.value, 0);

  const cols = distanceData.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <Card className="glass-card opacity-0 animate-fade-in-up-delay-3">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-lg bg-primary/20">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          Répartition par discipline {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className={`grid grid-cols-1 ${cols} gap-4`}>
          <DonutSection
            data={timeData}
            icon={<Timer className="h-3.5 w-3.5 text-emerald-400" />}
            title="Temps"
            subtitle={formatDuration(totalTime)}
            tooltipType="time"
            accentColor="hsl(160, 70%, 45%)"
          />
          {distanceData.length > 0 && (
            <DonutSection
              data={distanceData}
              icon={<MapPin className="h-3.5 w-3.5 text-blue-400" />}
              title="Distance"
              subtitle={formatDistance(totalDist)}
              tooltipType="distance"
              accentColor="hsl(210, 80%, 55%)"
            />
          )}
          {loadData.length > 0 && (
            <DonutSection
              data={loadData}
              icon={<Zap className="h-3.5 w-3.5 text-orange-400" />}
              title="Charge"
              subtitle={`${Math.round(totalLoad)} TSS`}
              tooltipType="load"
              accentColor="hsl(30, 90%, 55%)"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SportDistributionChart;
