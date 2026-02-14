import React, { useMemo, useCallback } from 'react';
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
  lat?: number;
  lng?: number;
  index?: number;
}

interface ElevationChartProps {
  data: ElevationPoint[];
  onHover?: (point: { lat: number; lng: number } | null) => void;
}

const ElevationChart: React.FC<ElevationChartProps> = ({ data, onHover }) => {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const altitudes = data.map(d => d.altitude).filter(a => a > 0);
    if (altitudes.length === 0) return null;

    const minAltitude = Math.min(...altitudes);
    const maxAltitude = Math.max(...altitudes);
    
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

  // Smooth the data for display while preserving GPS coordinates
  const smoothedData = useMemo(() => {
    if (data.length === 0) return [];
    
    const windowSize = Math.max(1, Math.floor(data.length / 200));
    const result: (ElevationPoint & { slope?: number })[] = [];
    
    for (let i = 0; i < data.length; i += windowSize) {
      const window = data.slice(i, Math.min(i + windowSize, data.length));
      const avgAltitude = window.reduce((sum, p) => sum + p.altitude, 0) / window.length;
      const midIndex = Math.min(i + Math.floor(windowSize / 2), data.length - 1);
      const midPoint = data[midIndex];
      
      result.push({
        distance: midPoint.distance,
        altitude: avgAltitude,
        lat: midPoint.lat,
        lng: midPoint.lng,
        index: midPoint.index
      });
    }

    // Calculate slope for each point
    for (let i = 0; i < result.length; i++) {
      if (i === 0) {
        result[i].slope = 0;
      } else {
        const dDist = (result[i].distance - result[i - 1].distance) * 1000; // km to m
        const dAlt = result[i].altitude - result[i - 1].altitude;
        result[i].slope = dDist > 0 ? (dAlt / dDist) * 100 : 0; // slope in %
      }
    }
    
    return result;
  }, [data]);

  // Build a slope-based gradient for the stroke
  const slopeGradientStops = useMemo(() => {
    if (smoothedData.length < 2) return [];
    const maxDist = smoothedData[smoothedData.length - 1].distance;
    if (maxDist === 0) return [];

    return smoothedData.map((point) => {
      const offset = (point.distance / maxDist) * 100;
      const slope = Math.abs(point.slope || 0);
      // 0% slope = green (#10b981), 8%+ slope = red (#ef4444)
      const t = Math.min(slope / 8, 1);
      // Interpolate hue: green (145) -> yellow (50) -> red (0)
      const hue = 145 - t * 145;
      const sat = 70 + t * 10;
      const light = 50;
      return { offset: `${offset}%`, color: `hsl(${hue}, ${sat}%, ${light}%)` };
    });
  }, [smoothedData]);

  const handleMouseMove = useCallback((state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const point = state.activePayload[0].payload;
      if (point.lat && point.lng && onHover) {
        onHover({ lat: point.lat, lng: point.lng });
      }
    }
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  if (!stats || smoothedData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const slope = point.slope || 0;
      const slopeColor = Math.abs(slope) < 3 ? 'text-emerald-400' : Math.abs(slope) < 6 ? 'text-yellow-400' : 'text-red-400';
      return (
        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            Distance: <span className="font-semibold text-foreground">{point.distance.toFixed(2)} km</span>
          </p>
          <p className="text-sm text-emerald-400 font-medium">
            Altitude: <span className="font-bold">{Math.round(payload[0].value)} m</span>
          </p>
          <p className={`text-sm ${slopeColor} font-medium`}>
            Pente: <span className="font-bold">{slope > 0 ? '+' : ''}{slope.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card overflow-hidden border-emerald-500/20">
      <CardHeader className="border-b border-border/50 pb-4 bg-gradient-to-r from-emerald-500/5 to-transparent">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <Mountain className="h-5 w-5 text-emerald-400" />
          </div>
          Profil d'altitude
          <div className="ml-auto flex items-center gap-4 text-sm font-normal">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">+{stats.elevationGain}m</span>
            </span>
            <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
              <TrendingDown className="h-4 w-4" />
              <span className="font-semibold">-{stats.elevationLoss}m</span>
            </span>
            <span className="text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              {stats.minAltitude}m - {stats.maxAltitude}m
            </span>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Survolez le graphique pour voir la position sur la carte
        </p>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={smoothedData}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="elevationFillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="elevationSlopeStroke" x1="0" y1="0" x2="1" y2="0">
                  {slopeGradientStops.map((stop, i) => (
                    <stop key={i} offset={stop.offset} stopColor={stop.color} />
                  ))}
                </linearGradient>
                <filter id="elevationGlow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <XAxis
                dataKey="distance"
                tickFormatter={(value) => `${value.toFixed(1)}`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ 
                  value: 'Distance (km)', 
                  position: 'insideBottom', 
                  offset: -5,
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11
                }}
              />
              <YAxis
                domain={['dataMin - 30', 'dataMax + 30']}
                tickFormatter={(value) => `${Math.round(value)}m`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={55}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ 
                  stroke: '#10b981', 
                  strokeWidth: 2, 
                  strokeDasharray: '4 4',
                  strokeOpacity: 0.6
                }}
              />
              <Area
                type="basis"
                dataKey="altitude"
                stroke="url(#elevationSlopeStroke)"
                strokeWidth={2}
                fill="url(#elevationFillGradient)"
                isAnimationActive={false}
                filter="url(#elevationGlow)"
                activeDot={{
                  r: 6,
                  fill: '#f59e0b',
                  stroke: '#fff',
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Slope gradient legend */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1">
            <div 
              className="h-6 rounded border border-border/50"
              style={{
                background: 'linear-gradient(to right, hsl(145, 70%, 50%), hsl(72.5, 80%, 50%), hsl(0, 70%, 50%))'
              }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="font-semibold text-emerald-400">0%</span>
              <span>Plat</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-yellow-400">4%</span>
              <span>Moyen</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-red-400">8%+</span>
              <span>Raide</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElevationChart;
