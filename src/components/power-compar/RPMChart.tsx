import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { RotateCcw } from 'lucide-react';

interface ChartDataPoint {
  time: number;
  power1: number | null;
  power2: number | null;
  rpm1: number | null;
  rpm2: number | null;
}

interface RPMChartProps {
  chartData: ChartDataPoint[];
  file1Name: string;
  file2Name: string;
}

const RPMChart: React.FC<RPMChartProps> = ({ chartData, file1Name, file2Name }) => {
  const formatXAxisTick = (value: number) => {
    const minutes = Math.round(value);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}min`;
  };

  const generateTicks = () => {
    if (chartData.length === 0) return [];
    
    const maxTime = Math.max(...chartData.map(d => d.time));
    const ticks = [];
    
    for (let i = 0; i <= maxTime; i += 5) {
      ticks.push(i);
    }
    
    return ticks;
  };

  const xAxisTicks = generateTicks();

  const getRpmDomain = () => {
    const rpmValues = chartData
      .flatMap(d => [d.rpm1, d.rpm2])
      .filter(v => v !== null && v !== undefined && !isNaN(v)) as number[];
    
    if (rpmValues.length === 0) return [0, 120];
    
    const min = Math.min(...rpmValues);
    const max = Math.max(...rpmValues);
    
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  };

  const rpmDomain = getRpmDomain();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const file1Rpm = payload.find((p: any) => p.dataKey === 'rpm1')?.value;
      const file2Rpm = payload.find((p: any) => p.dataKey === 'rpm2')?.value;
      
      let percentageDiff = null;
      if (file1Rpm && file2Rpm && file1Rpm > 0) {
        percentageDiff = Math.round(((file2Rpm - file1Rpm) / file1Rpm) * 100 * 10) / 10;
      }
      
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
          <p className="font-semibold text-foreground mb-2">
            Temps: {formatXAxisTick(Number(label))}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            
            const fileName = entry.dataKey === 'rpm1' ? file1Name : file2Name;
            const colorClass = entry.dataKey === 'rpm1' ? 'bg-amber-500' : 'bg-purple-500';
            
            return (
              <div key={index} className="flex items-center gap-2 py-1">
                <div className={`w-3 h-3 rounded-sm ${colorClass}`}></div>
                <span className="text-sm font-medium text-foreground">
                  {fileName}: {Math.round(entry.value)} RPM
                </span>
              </div>
            );
          })}
          {percentageDiff !== null && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <span className={`text-sm font-bold ${percentageDiff >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                Différence: {percentageDiff > 0 ? '+' : ''}{percentageDiff}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <RotateCcw className="h-5 w-5 text-purple-400" />
          </div>
          <span className="gradient-text">Comparaison de cadence</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Évolution de la cadence dans le temps (lissage 3 secondes)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="rpmGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rpmGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(217 33% 22%)" 
                strokeWidth={0.5}
                opacity={0.5}
              />
              <XAxis 
                dataKey="time" 
                fontSize={11}
                tickFormatter={formatXAxisTick}
                ticks={xAxisTicks}
                domain={['dataMin', 'dataMax']}
                type="number"
                scale="linear"
                tickLine={{ stroke: 'hsl(215 20% 40%)', strokeWidth: 0.5 }}
                axisLine={{ stroke: 'hsl(215 20% 40%)', strokeWidth: 0.5 }}
                interval={0}
                angle={0}
                textAnchor="middle"
                height={40}
                tick={{ fill: 'hsl(215 20% 65%)' }}
              />
              <YAxis 
                fontSize={11}
                label={{ 
                  value: 'RPM', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'hsl(215 20% 65%)', fontSize: '11px' }
                }}
                tickLine={{ stroke: 'hsl(215 20% 40%)', strokeWidth: 0.5 }}
                axisLine={{ stroke: 'hsl(215 20% 40%)', strokeWidth: 0.5 }}
                domain={rpmDomain}
                tickFormatter={(value) => Math.round(value).toString()}
                tick={{ fill: 'hsl(215 20% 65%)' }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'hsl(262 83% 58%)', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                iconType="line"
                formatter={(value) => <span style={{ color: 'hsl(215 20% 65%)' }}>{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="rpm1" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name={file1Name}
                connectNulls={false}
                fill="url(#rpmGradient1)"
                activeDot={{ r: 4, stroke: "#f59e0b", strokeWidth: 2, fill: 'hsl(222 47% 13%)' }}
              />
              <Line 
                type="monotone" 
                dataKey="rpm2" 
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                name={file2Name}
                connectNulls={false}
                fill="url(#rpmGradient2)"
                activeDot={{ r: 4, stroke: "#a855f7", strokeWidth: 2, fill: 'hsl(222 47% 13%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RPMChart;