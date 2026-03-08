import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RaceResult {
  id: string;
  name: string;
  race_type: string;
  distance: string;
  official_time_seconds: number;
  activity_date: string;
  activity_time_seconds: number | null;
}

const DISTANCES: Record<string, { value: string; label: string }[]> = {
  running: [
    { value: "5k", label: "5 km" },
    { value: "10k", label: "10 km" },
    { value: "semi", label: "Semi-marathon" },
    { value: "marathon", label: "Marathon" },
    { value: "trail_short", label: "Trail court" },
    { value: "trail_long", label: "Trail long" },
    { value: "ultra", label: "Ultra-trail" },
    { value: "other_run", label: "Autre" },
  ],
  triathlon: [
    { value: "super_sprint", label: "Super Sprint" },
    { value: "sprint", label: "Sprint" },
    { value: "olympic", label: "Olympique" },
    { value: "half_ironman", label: "Half Ironman" },
    { value: "ironman", label: "Ironman" },
    { value: "other_tri", label: "Autre" },
  ],
};

const formatTimeAxis = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}min`;
};

const formatTimeTooltip = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  return `${m}m${String(s).padStart(2, "0")}s`;
};

const getDistanceLabel = (type: string, distance: string) => {
  const found = DISTANCES[type]?.find((d) => d.value === distance);
  return found?.label || distance;
};

interface ProgressionChartProps {
  results: RaceResult[];
}

export default function ProgressionChart({ results }: ProgressionChartProps) {
  // All distance keys that have at least 2 results
  const distanceOptions = useMemo(() => {
    const counts: Record<string, { type: string; distance: string; count: number }> = {};
    results.forEach((r) => {
      const key = `${r.race_type}-${r.distance}`;
      if (!counts[key]) counts[key] = { type: r.race_type, distance: r.distance, count: 0 };
      counts[key].count++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v.count >= 2)
      .map(([key, v]) => ({ key, label: getDistanceLabel(v.type, v.distance) }));
  }, [results]);

  const [selectedKey, setSelectedKey] = useState<string>(() => distanceOptions[0]?.key || "");

  const chartData = useMemo(() => {
    if (!selectedKey) return [];
    const [type, dist] = selectedKey.split("-");
    return results
      .filter((r) => r.race_type === type && r.distance === dist)
      .sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime())
      .map((r) => ({
        date: new Date(r.activity_date).getTime(),
        dateLabel: format(new Date(r.activity_date), "dd MMM yy", { locale: fr }),
        official: r.official_time_seconds,
        activity: r.activity_time_seconds,
        name: r.name,
      }));
  }, [results, selectedKey]);

  if (distanceOptions.length === 0) return null;

  const minTime = Math.min(...chartData.map((d) => d.official));
  const maxTime = Math.max(...chartData.map((d) => d.official));
  const padding = Math.max((maxTime - minTime) * 0.15, 60);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            Progression
          </CardTitle>
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {distanceOptions.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <filter id="progressGlow">
                  <feGaussianBlur stdDeviation="0.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[minTime - padding, maxTime + padding]}
                tickFormatter={formatTimeAxis}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                reversed
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-lg">
                      <p className="text-xs font-semibold text-foreground">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground mb-1">{d.dateLabel}</p>
                      <p className="text-sm font-mono font-bold text-primary">
                        {formatTimeTooltip(d.official)}
                      </p>
                      {d.activity && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Séance : {formatTimeTooltip(d.activity)}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="basis"
                dataKey="official"
                fill="url(#progressGradient)"
                stroke="none"
              />
              <Line
                type="basis"
                dataKey="official"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                filter="url(#progressGlow)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
