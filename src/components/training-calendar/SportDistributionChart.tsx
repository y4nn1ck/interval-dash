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
  VirtualRide: 'hsl(142, 70%, 45%)',
  Ride: 'hsl(142, 70%, 55%)',
  Swim: 'hsl(210, 80%, 55%)',
  Hike: 'hsl(35, 70%, 50%)',
  Walk: 'hsl(35, 70%, 50%)',
  WeightTraining: 'hsl(280, 60%, 55%)',
  Yoga: 'hsl(180, 50%, 50%)',
};

const getSportLabel = (type: string) => {
  const lowerType = (type || '').toLowerCase();
  if (lowerType.includes('virtualride')) return 'HT Vélo';
  if (lowerType.includes('ride') || lowerType.includes('cycling') || lowerType.includes('bike')) return 'Vélo';
  if (lowerType.includes('run') || lowerType.includes('running')) return 'Course';
  if (lowerType.includes('swim') || lowerType.includes('swimming')) return 'Natation';
  if (lowerType.includes('hike') || lowerType.includes('walk')) return 'Rando';
  if (lowerType.includes('weight') || lowerType.includes('strength')) return 'Renfo';
  if (lowerType.includes('yoga')) return 'Yoga';
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
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{data.label}</p>
      <p className="text-muted-foreground">{formatted} ({data.percent}%)</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, label }: any) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
      {label}
    </text>
  );
};

interface DonutSectionProps {
  data: { name: string; label: string; value: number; percent: number; color: string }[];
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tooltipType: string;
}

const DonutSection = ({ data, icon, title, subtitle, tooltipType }: DonutSectionProps) => (
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
      {icon}
      {title} — {subtitle}
    </p>
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip type={tooltipType} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-1.5 text-xs">
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
          <span className="text-muted-foreground">{d.label}</span>
          <span className="font-semibold text-foreground">{d.percent}%</span>
        </div>
      ))}
    </div>
  </div>
);

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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Timer className="h-5 w-5 text-primary" />
          Répartition par discipline {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 ${cols} gap-6`}>
          <DonutSection data={timeData} icon={<Timer className="h-3.5 w-3.5" />} title="Temps" subtitle={formatDuration(totalTime)} tooltipType="time" />
          {distanceData.length > 0 && (
            <DonutSection data={distanceData} icon={<MapPin className="h-3.5 w-3.5" />} title="Distance" subtitle={formatDistance(totalDist)} tooltipType="distance" />
          )}
          {loadData.length > 0 && (
            <DonutSection data={loadData} icon={<Zap className="h-3.5 w-3.5" />} title="Charge" subtitle={`${Math.round(totalLoad)} TSS`} tooltipType="load" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SportDistributionChart;
