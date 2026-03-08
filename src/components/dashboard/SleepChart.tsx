import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SleepData {
  date: string;
  sleep_hours: number | null;
}

interface SleepChartProps {
  data: SleepData[];
}

const getSleepColor = (hours: number) => {
  if (hours >= 8) return '#10b981';
  if (hours >= 7) return '#3b82f6';
  if (hours >= 6) return '#f59e0b';
  return '#ef4444';
};

const getSleepLabel = (hours: number) => {
  if (hours >= 8) return 'Excellent';
  if (hours >= 7) return 'Bon';
  if (hours >= 6) return 'Moyen';
  return 'Insuffisant';
};

const formatSleepHours = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m.toString().padStart(2, '0')}`;
};

const SleepChart = ({ data }: SleepChartProps) => {
  const validData = data.filter(item => item.sleep_hours !== null && item.sleep_hours !== undefined);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p>Aucune donnée de sommeil disponible</p>
      </div>
    );
  }

  const avg = validData.reduce((s, d) => s + (d.sleep_hours || 0), 0) / validData.length;

  const chartConfig = {
    sleep_hours: { label: 'Sommeil', color: '#8b5cf6' },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const hours = payload[0]?.value as number;
    if (!hours) return null;
    const color = getSleepColor(hours);
    return (
      <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">
          {format(parseISO(label), 'EEEE d MMMM', { locale: fr })}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-bold" style={{ color }}>{formatSleepHours(hours)}</span>
          <span className="text-xs text-muted-foreground">— {getSleepLabel(hours)}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#8b5cf6]/50" />
          <span className="text-muted-foreground">Durée de sommeil</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-[3px] rounded-full bg-[#8b5cf6]" />
          <span className="text-muted-foreground">Tendance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-0 border-b-2 border-dashed border-muted-foreground/40" />
          <span className="text-muted-foreground">Moyenne ({formatSleepHours(avg)})</span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {[
            { label: '≥8h', color: '#10b981' },
            { label: '7-8h', color: '#3b82f6' },
            { label: '6-7h', color: '#f59e0b' },
            { label: '<6h', color: '#ef4444' },
          ].map(z => (
            <div key={z.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
              <span className="text-muted-foreground">{z.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={validData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="sleepAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sleepBarGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="sleepBarBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="sleepBarYellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="sleepBarRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.25} />
              </linearGradient>
              <filter id="sleepGlow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tickFormatter={(dateStr) => format(parseISO(dateStr), 'EEE', { locale: fr })}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              domain={[4, 10]}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}h`}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <ChartTooltip content={<CustomTooltip />} />

            {/* Average reference line */}
            <ReferenceLine
              y={avg}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 3"
              strokeOpacity={0.4}
            />

            {/* Area under the trend line */}
            <Area
              type="basis"
              dataKey="sleep_hours"
              fill="url(#sleepAreaGrad)"
              stroke="none"
            />

            {/* Bars with color based on quality */}
            <Bar
              dataKey="sleep_hours"
              radius={[4, 4, 0, 0]}
              barSize={24}
              strokeWidth={1}
            >
              {validData.map((entry, index) => {
                const h = entry.sleep_hours || 0;
                const gradId = h >= 8 ? 'sleepBarGreen' : h >= 7 ? 'sleepBarBlue' : h >= 6 ? 'sleepBarYellow' : 'sleepBarRed';
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${gradId})`}
                    stroke={getSleepColor(h)}
                    strokeOpacity={0.6}
                  />
                );
              })}
            </Bar>

            {/* Trend line */}
            <Line
              type="basis"
              dataKey="sleep_hours"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#8b5cf6', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
              activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: 'hsl(var(--card))' }}
              filter="url(#sleepGlow)"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default SleepChart;
