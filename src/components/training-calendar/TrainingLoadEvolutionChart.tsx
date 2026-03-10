import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { format, parseISO, subDays, subMonths, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIntervalsWellnessRange } from '@/hooks/useIntervalsData';
import { Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIODS = [
  { key: '1m', label: '1 mois', days: 30 },
  { key: '42d', label: '42 jours', days: 42 },
  { key: '3m', label: '3 mois', days: 90 },
  { key: '6m', label: '6 mois', days: 180 },
  { key: '1y', label: '1 an', days: 365 },
  { key: '2y', label: '2 ans', days: 730 },
] as const;

const TSB_ZONES = [
  { min: 25, max: 100, label: 'Frais', color: '#3b82f6', opacity: 0.15 },
  { min: 5, max: 25, label: 'Zone grise', color: '#9ca3af', opacity: 0.10 },
  { min: -10, max: 5, label: 'Optimal', color: '#22c55e', opacity: 0.15 },
  { min: -30, max: -10, label: 'Optimal', color: '#22c55e', opacity: 0.15 },
  { min: -50, max: -30, label: 'Overreach', color: '#f97316', opacity: 0.12 },
  { min: -100, max: -50, label: 'Danger', color: '#ef4444', opacity: 0.15 },
];

const TrainingLoadEvolutionChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('3m');

  const period = PERIODS.find(p => p.key === selectedPeriod) || PERIODS[2];
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), period.days), 'yyyy-MM-dd');

  const { data: wellnessData = [], isLoading } = useIntervalsWellnessRange(startDate, endDate);

  const chartData = useMemo(() => {
    return wellnessData.map(d => {
      const ctl = d.ctl || 0;
      const atl = d.atl || 0;
      // Modèle "Relative Form": (fitness - fatigue) / fitness * 100
      const relativeForm = ctl > 0 ? ((ctl - atl) / ctl) * 100 : 0;
      return {
        date: d.date,
        ctl: Math.round(ctl),
        atl: Math.round(atl),
        tsb: Math.round(relativeForm),
      };
    });
  }, [wellnessData]);

  const currentValues = useMemo(() => {
    if (chartData.length === 0) return { ctl: 0, atl: 0, tsb: 0 };
    const last = chartData[chartData.length - 1];
    return last;
  }, [chartData]);

  const tsbDomain = useMemo(() => {
    if (chartData.length === 0) return [-30, 30];
    const tsbs = chartData.map(d => d.tsb);
    const min = Math.min(...tsbs);
    const max = Math.max(...tsbs);
    return [Math.min(min - 5, -30), Math.max(max + 5, 30)];
  }, [chartData]);

  const formatXAxis = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (period.days <= 42) return format(date, 'dd/MM');
      if (period.days <= 180) return format(date, 'dd/MM');
      return format(date, 'MMM yy', { locale: fr });
    } catch { return dateStr; }
  };

  const tickInterval = useMemo(() => {
    if (period.days <= 42) return 7;
    if (period.days <= 90) return 14;
    if (period.days <= 180) return 30;
    if (period.days <= 365) return 60;
    return 90;
  }, [period.days]);

  const filteredTicks = useMemo(() => {
    return chartData
      .filter((_, i) => i % tickInterval === 0)
      .map(d => d.date);
  }, [chartData, tickInterval]);

  const chartConfig = {
    ctl: { label: 'Fitness (CTL)', color: '#10b981' },
    atl: { label: 'Fatigue (ATL)', color: '#f59e0b' },
    tsb: { label: 'Forme (TSB)', color: '#3b82f6' },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    let dateLabel = '';
    try { dateLabel = format(parseISO(label), 'd MMM yyyy', { locale: fr }); } catch { dateLabel = label; }
    const seen = new Set<string>();
    const uniquePayload = payload.filter((entry: any) => {
      if (seen.has(entry.dataKey)) return false;
      seen.add(entry.dataKey);
      return true;
    });
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl p-3 text-sm">
        <p className="font-medium text-foreground mb-2">{dateLabel}</p>
        {uniquePayload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}:</span>
            <span className="font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const getTsbZoneLabel = (tsb: number) => {
    const zone = TSB_ZONES.find(z => tsb >= z.min && tsb < z.max);
    return zone?.label || '';
  };

  return (
    <div className="space-y-4 opacity-0 animate-fade-in-up-delay-3">
      {/* Fitness & Fatigue Chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Charge d'entraînement</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Évolution de la fitness et de la fatigue</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              {PERIODS.map(p => (
                <Button
                  key={p.key}
                  variant={selectedPeriod === p.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod(p.key)}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium",
                    selectedPeriod === p.key && "shadow-sm"
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          {/* Legend with current values */}
          <div className="flex items-center gap-6 mt-3 pl-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Fitness (CTL)</span>
              <span className="text-sm font-bold text-emerald-500">{currentValues.ctl}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">Fatigue (ATL)</span>
              <span className="text-sm font-bold text-amber-500">{currentValues.atl}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="atlFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <filter id="ctlGlow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxis}
                    ticks={filteredTicks}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Area
                    type="basis"
                    dataKey="ctl"
                    fill="url(#ctlFill)"
                    stroke="none"
                    legendType="none"
                    tooltipType="none"
                  />
                  <Area
                    type="basis"
                    dataKey="atl"
                    fill="url(#atlFill)"
                    stroke="none"
                    legendType="none"
                    tooltipType="none"
                  />
                  <Line
                    type="basis"
                    dataKey="ctl"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    filter="url(#ctlGlow)"
                  />
                  <Line
                    type="basis"
                    dataKey="atl"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* TSB / Form Chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Forme (TSB)</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Training Stress Balance — différence entre fitness et fatigue</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">TSB</span>
              <span className={cn(
                "text-sm font-bold",
                currentValues.tsb >= 5 ? "text-emerald-500" :
                currentValues.tsb >= -10 ? "text-blue-500" : "text-red-500"
              )}>
                {currentValues.tsb > 0 ? '+' : ''}{currentValues.tsb}
              </span>
              <span className="text-xs text-muted-foreground ml-1">({getTsbZoneLabel(currentValues.tsb)})</span>
            </div>
          </div>
          {/* Zone legend */}
          <div className="flex flex-wrap items-center gap-3 mt-2 pl-1">
            {TSB_ZONES.filter(z => z.min >= -30).map(zone => (
              <div key={zone.label} className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: zone.color, opacity: zone.opacity * 4 }} />
                <span className="text-[11px] text-muted-foreground">{zone.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="tsbPosFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tsbNegFill" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  {/* TSB Zone backgrounds */}
                  {TSB_ZONES.map(zone => (
                    <ReferenceArea
                      key={zone.label}
                      y1={Math.max(zone.min, tsbDomain[0])}
                      y2={Math.min(zone.max, tsbDomain[1])}
                      fill={zone.color}
                      fillOpacity={zone.opacity}
                      stroke="none"
                    />
                  ))}
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxis}
                    ticks={filteredTicks}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    domain={tsbDomain}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} strokeDasharray="3 3" />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Area
                    type="basis"
                    dataKey="tsb"
                    fill="url(#tsbPosFill)"
                    stroke="none"
                    baseValue={0}
                    legendType="none"
                    tooltipType="none"
                  />
                  <Line
                    type="basis"
                    dataKey="tsb"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingLoadEvolutionChart;
