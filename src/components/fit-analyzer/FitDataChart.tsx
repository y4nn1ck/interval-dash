import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ChartDataPoint {
  time: number;
  power: number | null;
  cadence: number | null;
  heart_rate: number | null;
}

interface FitDataChartProps {
  data: ChartDataPoint[];
  zoomDomain?: [number, number] | null;
  onResetZoom?: () => void;
}

const FitDataChart: React.FC<FitDataChartProps> = ({ data, zoomDomain, onResetZoom }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showPower, setShowPower] = useState(true);
  const [showCadence, setShowCadence] = useState(true);
  const [showHeartRate, setShowHeartRate] = useState(true);

  // Update isZoomed state when zoomDomain changes
  useEffect(() => {
    setIsZoomed(!!zoomDomain);
  }, [zoomDomain]);

  // Custom tick formatter for 5-minute intervals
  const formatXAxisTick = (value: number) => {
    const minutes = Math.round(value);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}min`;
  };

  // Get filtered data based on zoom
  const getFilteredData = () => {
    if (!zoomDomain) return data;
    
    return data.filter(point => 
      point.time >= zoomDomain[0] && point.time <= zoomDomain[1]
    );
  };

  const chartData = getFilteredData();

  // Generate ticks every 5 minutes
  const generateTicks = () => {
    if (chartData.length === 0) return [];
    
    const minTime = zoomDomain ? zoomDomain[0] : Math.min(...chartData.map(d => d.time));
    const maxTime = zoomDomain ? zoomDomain[1] : Math.max(...chartData.map(d => d.time));
    const ticks = [];
    
    const startTick = Math.floor(minTime / 5) * 5;
    for (let i = startTick; i <= maxTime; i += 5) {
      ticks.push(i);
    }
    
    return ticks;
  };

  const xAxisTicks = generateTicks();

  // Custom tooltip component with color squares
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
          <p className="font-semibold text-foreground mb-2">
            Temps: {formatXAxisTick(Number(label))}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            
            let unit = '';
            let colorClass = '';
            
            switch (entry.dataKey) {
              case 'power':
                unit = 'W';
                colorClass = 'bg-orange-500';
                break;
              case 'cadence':
                unit = ' RPM';
                colorClass = 'bg-purple-500';
                break;
              case 'heart_rate':
                unit = ' BPM';
                colorClass = 'bg-red-500';
                break;
            }
            
            return (
              <div key={index} className="flex items-center gap-2 py-1">
                <div className={`w-3 h-3 rounded-sm ${colorClass}`}></div>
                <span className="text-sm font-medium text-foreground">
                  {entry.name}: {Math.round(entry.value)}{unit}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Calculate proper Y axis domains to avoid aberrant values
  const getYAxisDomain = (dataKey: 'power' | 'cadence' | 'heart_rate') => {
    const values = chartData
      .map(d => d[dataKey])
      .filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];
    
    if (values.length === 0) return [0, 100];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add padding
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  };

  const powerDomain = getYAxisDomain('power');
  const cadenceDomain = getYAxisDomain('cadence');
  const heartRateDomain = getYAxisDomain('heart_rate');

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-1 h-8 bg-gradient-to-b from-orange-500 via-purple-500 to-red-500 rounded-full"></div>
          <span className="gradient-text">Données d'entraînement</span>
          {isZoomed && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetZoom}
              className="ml-auto border-border/50 hover:bg-primary/20 hover:text-primary"
            >
              <ZoomOut className="h-4 w-4 mr-2" />
              Réinitialiser zoom
            </Button>
          )}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isZoomed ? 'Vue zoomée sur l\'intervalle sélectionné' : 'Évolution de la puissance, cadence et fréquence cardiaque'}
        </CardDescription>
        
        {/* Chart Controls */}
        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="power"
              checked={showPower}
              onCheckedChange={(checked) => setShowPower(checked === true)}
              className="border-orange-500 data-[state=checked]:bg-orange-500"
            />
            <label htmlFor="power" className="text-sm font-medium text-orange-400 cursor-pointer">
              Puissance
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cadence"
              checked={showCadence}
              onCheckedChange={(checked) => setShowCadence(checked === true)}
              className="border-purple-500 data-[state=checked]:bg-purple-500"
            />
            <label htmlFor="cadence" className="text-sm font-medium text-purple-400 cursor-pointer">
              Cadence
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="heartRate"
              checked={showHeartRate}
              onCheckedChange={(checked) => setShowHeartRate(checked === true)}
              className="border-red-500 data-[state=checked]:bg-red-500"
            />
            <label htmlFor="heartRate" className="text-sm font-medium text-red-400 cursor-pointer">
              Fréquence Cardiaque
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="powerGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#f97316" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cadenceGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#a855f7" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="heartRateGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="powerStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fb923c"/>
                  <stop offset="50%" stopColor="#f97316"/>
                  <stop offset="100%" stopColor="#ea580c"/>
                </linearGradient>
                <linearGradient id="cadenceStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c084fc"/>
                  <stop offset="50%" stopColor="#a855f7"/>
                  <stop offset="100%" stopColor="#9333ea"/>
                </linearGradient>
                <linearGradient id="heartRateStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f87171"/>
                  <stop offset="50%" stopColor="#ef4444"/>
                  <stop offset="100%" stopColor="#dc2626"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeWidth={0.5}
                opacity={0.3}
              />
              <XAxis 
                dataKey="time" 
                fontSize={11}
                tickFormatter={formatXAxisTick}
                ticks={xAxisTicks}
                domain={zoomDomain || ['dataMin', 'dataMax']}
                type="number"
                scale="linear"
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                interval={0}
                angle={0}
                textAnchor="middle"
                height={40}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                fontSize={11}
                label={{ 
                  value: 'Puissance (W) / Cadence (RPM)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: '11px' }
                }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                domain={[0, Math.max(...powerDomain, ...cadenceDomain)]}
                tickFormatter={(value) => Math.round(value).toString()}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                fontSize={11}
                label={{ 
                  value: 'FC (BPM)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: '11px' }
                }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                domain={heartRateDomain}
                tickFormatter={(value) => Math.round(value).toString()}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                iconType="line"
                formatter={(value) => <span className="text-muted-foreground">{value}</span>}
              />
              
              {/* Power Area + Line */}
              {showPower && (
                <>
                  <Area 
                    yAxisId="left"
                    type="natural" 
                    dataKey="power" 
                    stroke="none"
                    fill="url(#powerGradientFill)"
                    connectNulls={false}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                  <Line 
                    yAxisId="left"
                    type="natural" 
                    dataKey="power" 
                    stroke="url(#powerStroke)"
                    strokeWidth={2.5}
                    dot={false}
                    name="Puissance (W)"
                    connectNulls={false}
                    filter="url(#glow)"
                    animationDuration={1000}
                    animationEasing="ease-out"
                    activeDot={{ 
                      r: 6, 
                      stroke: "#f97316", 
                      strokeWidth: 2, 
                      fill: 'hsl(var(--card))',
                      filter: 'drop-shadow(0 0 4px #f97316)'
                    }}
                  />
                </>
              )}
              
              {/* Cadence Area + Line */}
              {showCadence && (
                <>
                  <Area 
                    yAxisId="left"
                    type="natural" 
                    dataKey="cadence" 
                    stroke="none"
                    fill="url(#cadenceGradientFill)"
                    connectNulls={false}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                  <Line 
                    yAxisId="left"
                    type="natural" 
                    dataKey="cadence" 
                    stroke="url(#cadenceStroke)"
                    strokeWidth={2.5}
                    dot={false}
                    name="Cadence (RPM)"
                    connectNulls={false}
                    filter="url(#glow)"
                    animationDuration={1000}
                    animationEasing="ease-out"
                    activeDot={{ 
                      r: 6, 
                      stroke: "#a855f7", 
                      strokeWidth: 2, 
                      fill: 'hsl(var(--card))',
                      filter: 'drop-shadow(0 0 4px #a855f7)'
                    }}
                  />
                </>
              )}
              
              {/* Heart Rate Area + Line */}
              {showHeartRate && (
                <>
                  <Area 
                    yAxisId="right"
                    type="natural" 
                    dataKey="heart_rate" 
                    stroke="none"
                    fill="url(#heartRateGradientFill)"
                    connectNulls={false}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                  <Line 
                    yAxisId="right"
                    type="natural" 
                    dataKey="heart_rate" 
                    stroke="url(#heartRateStroke)"
                    strokeWidth={2.5}
                    dot={false}
                    name="Fréquence Cardiaque (BPM)"
                    connectNulls={false}
                    filter="url(#glow)"
                    animationDuration={1000}
                    animationEasing="ease-out"
                    activeDot={{ 
                      r: 6, 
                      stroke: "#ef4444", 
                      strokeWidth: 2, 
                      fill: 'hsl(var(--card))',
                      filter: 'drop-shadow(0 0 4px #ef4444)'
                    }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FitDataChart;
