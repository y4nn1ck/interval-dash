import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartDataPoint {
  time: number;
  power1: number | null;
  power2: number | null;
  rpm1: number | null;
  rpm2: number | null;
}

interface PowerChartProps {
  chartData: ChartDataPoint[];
  file1Name: string;
  file2Name: string;
}

const PowerChart: React.FC<PowerChartProps> = ({ chartData, file1Name, file2Name }) => {
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

  // Generate ticks every 5 minutes
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

  // Calculate proper Y axis domain to avoid aberrant values
  const getPowerDomain = () => {
    const powerValues = chartData
      .flatMap(d => [d.power1, d.power2])
      .filter(v => v !== null && v !== undefined && !isNaN(v)) as number[];
    
    if (powerValues.length === 0) return [0, 500];
    
    const min = Math.min(...powerValues);
    const max = Math.max(...powerValues);
    
    // Add padding
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  };

  const powerDomain = getPowerDomain();

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const file1Power = payload.find((p: any) => p.dataKey === 'power1')?.value;
      const file2Power = payload.find((p: any) => p.dataKey === 'power2')?.value;
      
      let percentageDiff = null;
      if (file1Power && file2Power && file1Power > 0) {
        percentageDiff = Math.round(((file2Power - file1Power) / file1Power) * 100 * 10) / 10;
      }
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-gray-800 mb-2">
            Temps: {formatXAxisTick(Number(label))}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            
            const fileName = entry.dataKey === 'power1' ? file1Name : file2Name;
            const color = entry.dataKey === 'power1' ? '#10b981' : '#3b82f6';
            
            return (
              <div key={index} className="flex items-center gap-2 py-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                <span className="text-sm font-medium text-gray-700">
                  {fileName}: {Math.round(entry.value)}W
                </span>
              </div>
            );
          })}
          {percentageDiff !== null && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">
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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
          Comparaison des données de puissance
        </CardTitle>
        <CardDescription>Évolution de la puissance dans le temps pour les deux fichiers (lissage 3 secondes)</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="powerGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="powerGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#e2e8f0" 
                strokeWidth={0.5}
                opacity={0.5}
              />
              <XAxis 
                dataKey="time" 
                className="text-gray-600"
                fontSize={11}
                tickFormatter={formatXAxisTick}
                ticks={xAxisTicks}
                domain={['dataMin', 'dataMax']}
                type="number"
                scale="linear"
                tickLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                interval={0}
                angle={0}
                textAnchor="middle"
                height={40}
              />
              <YAxis 
                className="text-gray-600"
                fontSize={11}
                label={{ 
                  value: 'Puissance (W)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b', fontSize: '11px' }
                }}
                tickLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                domain={powerDomain}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="power1" 
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name={file1Name}
                connectNulls={false}
                fill="url(#powerGradient1)"
                activeDot={{ 
                  r: 4, 
                  stroke: "#10b981", 
                  strokeWidth: 2, 
                  fill: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="power2" 
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name={file2Name}
                connectNulls={false}
                fill="url(#powerGradient2)"
                activeDot={{ 
                  r: 4, 
                  stroke: "#3b82f6", 
                  strokeWidth: 2, 
                  fill: '#fff'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PowerChart;