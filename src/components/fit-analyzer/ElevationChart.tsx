import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ElevationPoint {
  distance: number;
  altitude: number;
}

interface ElevationChartProps {
  data: ElevationPoint[];
}

const ElevationChart: React.FC<ElevationChartProps> = ({ data }) => {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const altitudes = data.map(d => d.altitude).filter(a => a > 0);
    if (altitudes.length === 0) return null;

    const minAltitude = Math.min(...altitudes);
    const maxAltitude = Math.max(...altitudes);
    
    // Calculate elevation gain and loss
    let elevationGain = 0;
    let elevationLoss = 0;
    
    for (let i = 1; i < data.length; i++) {
      const diff = data[i].altitude - data[i - 1].altitude;
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }

    return {
      minAltitude: Math.round(minAltitude),
      maxAltitude: Math.round(maxAltitude),
      elevationGain: Math.round(elevationGain),
      elevationLoss: Math.round(elevationLoss),
    };
  }, [data]);

  // Smooth the data for display
  const smoothedData = useMemo(() => {
    if (data.length === 0) return [];
    
    const windowSize = Math.max(1, Math.floor(data.length / 200));
    const result: ElevationPoint[] = [];
    
    for (let i = 0; i < data.length; i += windowSize) {
      const window = data.slice(i, Math.min(i + windowSize, data.length));
      const avgAltitude = window.reduce((sum, p) => sum + p.altitude, 0) / window.length;
      result.push({
        distance: data[Math.min(i + Math.floor(windowSize / 2), data.length - 1)].distance,
        altitude: avgAltitude,
      });
    }
    
    return result;
  }, [data]);

  if (!stats || smoothedData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            Distance: <span className="font-medium text-foreground">{payload[0].payload.distance.toFixed(2)} km</span>
          </p>
          <p className="text-sm text-emerald-400">
            Altitude: <span className="font-medium">{Math.round(payload[0].value)} m</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Mountain className="h-5 w-5 text-emerald-400" />
          </div>
          Profil d'altitude
          <div className="ml-auto flex items-center gap-4 text-sm font-normal">
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              +{stats.elevationGain}m
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <TrendingDown className="h-4 w-4" />
              -{stats.elevationLoss}m
            </span>
            <span className="text-muted-foreground">
              {stats.minAltitude}m - {stats.maxAltitude}m
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={smoothedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="distance"
                tickFormatter={(value) => `${value.toFixed(1)}`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={['dataMin - 20', 'dataMax + 20']}
                tickFormatter={(value) => `${Math.round(value)}m`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="basis"
                dataKey="altitude"
                stroke="hsl(var(--chart-2))"
                strokeWidth={1.5}
                fill="url(#elevationGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Distance (km)
        </p>
      </CardContent>
    </Card>
  );
};

export default ElevationChart;
