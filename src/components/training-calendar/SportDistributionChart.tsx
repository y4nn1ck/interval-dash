import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Timer, MapPin } from 'lucide-react';
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
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{data.label}</p>
      <p className="text-muted-foreground">
        {type === 'time' ? formatDuration(data.value) : formatDistance(data.value)}
        {' '}({data.percent}%)
      </p>
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

const SportDistributionChart = ({ activities, viewMode = 'week' }: SportDistributionChartProps) => {
  const periodLabel = viewMode === 'month' ? 'du mois' : 'de la semaine';

  const { timeData, distanceData } = useMemo(() => {
    const grouped: Record<string, { time: number; distance: number }> = {};
    activities.forEach((a) => {
      const key = a.type || 'Other';
      if (!grouped[key]) grouped[key] = { time: 0, distance: 0 };
      grouped[key].time += a.moving_time || 0;
      grouped[key].distance += a.distance || 0;
    });

    const totalTime = Object.values(grouped).reduce((s, v) => s + v.time, 0);
    const totalDist = Object.values(grouped).reduce((s, v) => s + v.distance, 0);

    const timeData = Object.entries(grouped)
      .filter(([, v]) => v.time > 0)
      .map(([type, v]) => ({
        name: type,
        label: getSportLabel(type),
        value: v.time,
        percent: totalTime > 0 ? Math.round((v.time / totalTime) * 100) : 0,
        color: getSportColor(type),
      }))
      .sort((a, b) => b.value - a.value);

    const distanceData = Object.entries(grouped)
      .filter(([, v]) => v.distance > 0)
      .map(([type, v]) => ({
        name: type,
        label: getSportLabel(type),
        value: v.distance,
        percent: totalDist > 0 ? Math.round((v.distance / totalDist) * 100) : 0,
        color: getSportColor(type),
      }))
      .sort((a, b) => b.value - a.value);

    return { timeData, distanceData };
  }, [activities]);

  if (activities.length === 0 || timeData.length < 2) return null;

  const totalTime = timeData.reduce((s, d) => s + d.value, 0);
  const totalDist = distanceData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="glass-card opacity-0 animate-fade-in-up-delay-3">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Timer className="h-5 w-5 text-primary" />
          Répartition par discipline {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time distribution */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Temps — {formatDuration(totalTime)}
            </p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                    strokeWidth={0}
                  >
                    {timeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip type="time" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {timeData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-semibold text-foreground">{d.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Distance distribution */}
          {distanceData.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Distance — {formatDistance(totalDist)}
              </p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                      strokeWidth={0}
                    >
                      {distanceData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip type="distance" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {distanceData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-semibold text-foreground">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SportDistributionChart;
