import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RestingHRData {
  date: string;
  resting_hr: number;
}

interface RestingHRChartProps {
  data: RestingHRData[];
}

const getHRColor = (hr: number) => {
  if (hr <= 48) return '#10b981';
  if (hr <= 52) return '#3b82f6';
  if (hr <= 56) return '#f59e0b';
  return '#ef4444';
};

const getHRLabel = (hr: number) => {
  if (hr <= 48) return 'Excellent';
  if (hr <= 52) return 'Bon';
  if (hr <= 56) return 'Moyen';
  return 'Élevé';
};

const RestingHRChart = ({ data }: RestingHRChartProps) => {
  const validData = data.filter(item => item.resting_hr && item.resting_hr > 0);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p>Aucune donnée de fréquence cardiaque disponible</p>
      </div>
    );
  }

  const avg = validData.reduce((s, d) => s + d.resting_hr, 0) / validData.length;

  const chartConfig = {
    resting_hr: { label: 'FC Repos', color: '#ef4444' },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const hr = payload[0]?.value as number;
    if (!hr) return null;
    const color = getHRColor(hr);
    return (
      <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">
          {format(parseISO(label), 'EEEE d MMMM', { locale: fr })}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-bold" style={{ color }}>{hr} bpm</span>
          <span className="text-xs text-muted-foreground">— {getHRLabel(hr)}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#ef4444]/50" />
          <span className="text-muted-foreground">FC au repos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-[3px] rounded-full bg-[#ef4444]" />
          <span className="text-muted-foreground">Tendance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-0 border-b-2 border-dashed border-muted-foreground/40" />
          <span className="text-muted-foreground">Moyenne ({Math.round(avg)} bpm)</span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {[
            { label: '≤48', color: '#10b981' },
            { label: '49-52', color: '#3b82f6' },
            { label: '53-56', color: '#f59e0b' },
            { label: '>56', color: '#ef4444' },
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
              <linearGradient id="hrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hrBarGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="hrBarBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="hrBarYellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="hrBarRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.25} />
              </linearGradient>
              <filter id="hrGlow">
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
              domain={['dataMin - 5', 'dataMax + 5']}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <ChartTooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={avg}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 3"
              strokeOpacity={0.4}
            />

            <Area
              type="basis"
              dataKey="resting_hr"
              fill="url(#hrAreaGrad)"
              stroke="none"
            />

            <Bar
              dataKey="resting_hr"
              radius={[4, 4, 0, 0]}
              barSize={24}
              strokeWidth={1}
            >
              {validData.map((entry, index) => {
                const hr = entry.resting_hr;
                const gradId = hr <= 48 ? 'hrBarGreen' : hr <= 52 ? 'hrBarBlue' : hr <= 56 ? 'hrBarYellow' : 'hrBarRed';
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${gradId})`}
                    stroke={getHRColor(hr)}
                    strokeOpacity={0.6}
                  />
                );
              })}
            </Bar>

            <Line
              type="basis"
              dataKey="resting_hr"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#ef4444', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
              activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2, fill: 'hsl(var(--card))' }}
              filter="url(#hrGlow)"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default RestingHRChart;
