import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeightData {
  date: string;
  weight: number | null;
}

interface WeightChartProps {
  data: WeightData[];
}

const getWeightColor = (weight: number, avg: number) => {
  const diff = Math.abs(weight - avg);
  if (diff <= 0.3) return '#10b981';
  if (diff <= 0.8) return '#3b82f6';
  if (diff <= 1.5) return '#f59e0b';
  return '#ef4444';
};

const WeightChart = ({ data }: WeightChartProps) => {
  const validData = data.filter(item => item.weight !== null && item.weight !== undefined && item.weight > 0);

  if (validData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p>Aucune donnée de poids disponible</p>
      </div>
    );
  }

  const avg = validData.reduce((s, d) => s + (d.weight || 0), 0) / validData.length;

  const chartConfig = {
    weight: { label: 'Poids', color: '#06b6d4' },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const weight = payload[0]?.value as number;
    if (!weight) return null;
    const color = getWeightColor(weight, avg);
    const diff = weight - avg;
    const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    return (
      <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">
          {format(parseISO(label), 'EEEE d MMMM', { locale: fr })}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-bold" style={{ color }}>{weight.toFixed(1)} kg</span>
          <span className="text-xs text-muted-foreground">({diffStr} vs moy.)</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#06b6d4]/50" />
          <span className="text-muted-foreground">Poids corporel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-[3px] rounded-full bg-[#06b6d4]" />
          <span className="text-muted-foreground">Tendance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-0 border-b-2 border-dashed border-muted-foreground/40" />
          <span className="text-muted-foreground">Moyenne ({avg.toFixed(1)} kg)</span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {[
            { label: 'Stable', color: '#10b981' },
            { label: 'Léger écart', color: '#3b82f6' },
            { label: 'Écart moyen', color: '#f59e0b' },
            { label: 'Grand écart', color: '#ef4444' },
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
              <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="weightBarGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="weightBarBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="weightBarYellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="weightBarRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.25} />
              </linearGradient>
              <filter id="weightGlow">
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
              domain={['dataMin - 1', 'dataMax + 1']}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}kg`}
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
              dataKey="weight"
              fill="url(#weightAreaGrad)"
              stroke="none"
            />

            <Bar
              dataKey="weight"
              radius={[4, 4, 0, 0]}
              barSize={24}
              strokeWidth={1}
            >
              {validData.map((entry, index) => {
                const w = entry.weight || 0;
                const diff = Math.abs(w - avg);
                const gradId = diff <= 0.3 ? 'weightBarGreen' : diff <= 0.8 ? 'weightBarBlue' : diff <= 1.5 ? 'weightBarYellow' : 'weightBarRed';
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${gradId})`}
                    stroke={getWeightColor(w, avg)}
                    strokeOpacity={0.6}
                  />
                );
              })}
            </Bar>

            <Line
              type="basis"
              dataKey="weight"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#06b6d4', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
              activeDot={{ r: 5, stroke: '#06b6d4', strokeWidth: 2, fill: 'hsl(var(--card))' }}
              filter="url(#weightGlow)"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default WeightChart;
