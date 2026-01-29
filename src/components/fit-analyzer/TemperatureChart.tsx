import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Thermometer } from 'lucide-react';

interface TemperatureDataPoint {
  time: number;
  temperature: number | null;
  core_temperature: number | null;
  skin_temperature: number | null;
}

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
}

const TemperatureChart: React.FC<TemperatureChartProps> = ({ data }) => {
  const [showTemperature, setShowTemperature] = useState(true);
  const [showCoreTemp, setShowCoreTemp] = useState(true);
  const [showSkinTemp, setShowSkinTemp] = useState(true);

  // Check which temperature data is available
  const hasTemperature = data.some(d => d.temperature !== null);
  const hasCoreTemp = data.some(d => d.core_temperature !== null);
  const hasSkinTemp = data.some(d => d.skin_temperature !== null);

  // Format X axis tick
  const formatXAxisTick = (value: number) => {
    const minutes = Math.round(value);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}min`;
  };

  // Generate ticks every 5 minutes
  const generateTicks = () => {
    if (data.length === 0) return [];
    
    const minTime = Math.min(...data.map(d => d.time));
    const maxTime = Math.max(...data.map(d => d.time));
    const ticks = [];
    
    const startTick = Math.floor(minTime / 5) * 5;
    for (let i = startTick; i <= maxTime; i += 5) {
      ticks.push(i);
    }
    
    return ticks;
  };

  const xAxisTicks = generateTicks();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
          <p className="font-semibold text-foreground mb-2">
            Temps: {formatXAxisTick(Number(label))}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            
            let colorClass = '';
            switch (entry.dataKey) {
              case 'temperature':
                colorClass = 'bg-yellow-500';
                break;
              case 'core_temperature':
                colorClass = 'bg-orange-500';
                break;
              case 'skin_temperature':
                colorClass = 'bg-cyan-500';
                break;
            }
            
            return (
              <div key={index} className="flex items-center gap-2 py-1">
                <div className={`w-3 h-3 rounded-sm ${colorClass}`}></div>
                <span className="text-sm font-medium text-foreground">
                  {entry.name}: {(entry.value as number).toFixed(1)}°C
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Calculate Y axis domain
  const getYAxisDomain = () => {
    const allTemps: number[] = [];
    data.forEach(d => {
      if (d.temperature) allTemps.push(d.temperature);
      if (d.core_temperature) allTemps.push(d.core_temperature);
      if (d.skin_temperature) allTemps.push(d.skin_temperature);
    });
    
    if (allTemps.length === 0) return [35, 42];
    
    const min = Math.min(...allTemps);
    const max = Math.max(...allTemps);
    const padding = (max - min) * 0.1;
    
    return [Math.max(30, Math.floor(min - padding)), Math.ceil(max + padding)];
  };

  const yDomain = getYAxisDomain();

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <Thermometer className="h-5 w-5 text-yellow-400" />
          </div>
          <span className="gradient-text">Données de température</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Évolution de la température pendant l'entraînement
        </CardDescription>
        
        {/* Chart Controls */}
        <div className="flex items-center gap-6 pt-4">
          {hasTemperature && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="temperature"
                checked={showTemperature}
                onCheckedChange={(checked) => setShowTemperature(checked === true)}
                className="border-yellow-500 data-[state=checked]:bg-yellow-500"
              />
              <label htmlFor="temperature" className="text-sm font-medium text-yellow-400 cursor-pointer">
                Température
              </label>
            </div>
          )}
          {hasCoreTemp && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="coreTemp"
                checked={showCoreTemp}
                onCheckedChange={(checked) => setShowCoreTemp(checked === true)}
                className="border-orange-500 data-[state=checked]:bg-orange-500"
              />
              <label htmlFor="coreTemp" className="text-sm font-medium text-orange-400 cursor-pointer">
                Température Core
              </label>
            </div>
          )}
          {hasSkinTemp && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skinTemp"
                checked={showSkinTemp}
                onCheckedChange={(checked) => setShowSkinTemp(checked === true)}
                className="border-cyan-500 data-[state=checked]:bg-cyan-500"
              />
              <label htmlFor="skinTemp" className="text-sm font-medium text-cyan-400 cursor-pointer">
                Température Peau
              </label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="tempGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#eab308" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="coreTempGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#f97316" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="skinTempGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="tempStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fde047"/>
                  <stop offset="50%" stopColor="#eab308"/>
                  <stop offset="100%" stopColor="#ca8a04"/>
                </linearGradient>
                <linearGradient id="coreTempStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fb923c"/>
                  <stop offset="50%" stopColor="#f97316"/>
                  <stop offset="100%" stopColor="#ea580c"/>
                </linearGradient>
                <linearGradient id="skinTempStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee"/>
                  <stop offset="50%" stopColor="#06b6d4"/>
                  <stop offset="100%" stopColor="#0891b2"/>
                </linearGradient>
                <filter id="glowTemp">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
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
                domain={['dataMin', 'dataMax']}
                type="number"
                scale="linear"
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                interval={0}
                height={40}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={11}
                label={{ 
                  value: 'Température (°C)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: '11px' }
                }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 0.5 }}
                domain={yDomain}
                tickFormatter={(value) => value.toFixed(1)}
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
              
              {/* Temperature Area + Line */}
              {hasTemperature && showTemperature && (
                <>
                  <Area 
                    type="basis" 
                    dataKey="temperature" 
                    stroke="none"
                    fill="url(#tempGradientFill)"
                    connectNulls={false}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line 
                    type="basis" 
                    dataKey="temperature" 
                    stroke="url(#tempStroke)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Température"
                    connectNulls={false}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeDot={{ r: 5, stroke: "#eab308", strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  />
                </>
              )}
              
              {/* Core Temperature Area + Line */}
              {hasCoreTemp && showCoreTemp && (
                <>
                  <Area 
                    type="basis" 
                    dataKey="core_temperature" 
                    stroke="none"
                    fill="url(#coreTempGradientFill)"
                    connectNulls={false}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line 
                    type="basis" 
                    dataKey="core_temperature" 
                    stroke="url(#coreTempStroke)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Température Core"
                    connectNulls={false}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeDot={{ r: 5, stroke: "#f97316", strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  />
                </>
              )}
              
              {/* Skin Temperature Area + Line */}
              {hasSkinTemp && showSkinTemp && (
                <>
                  <Area 
                    type="basis" 
                    dataKey="skin_temperature" 
                    stroke="none"
                    fill="url(#skinTempGradientFill)"
                    connectNulls={false}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line 
                    type="basis" 
                    dataKey="skin_temperature" 
                    stroke="url(#skinTempStroke)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Température Peau"
                    connectNulls={false}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeDot={{ r: 5, stroke: "#06b6d4", strokeWidth: 2, fill: 'hsl(var(--card))' }}
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

export default TemperatureChart;
