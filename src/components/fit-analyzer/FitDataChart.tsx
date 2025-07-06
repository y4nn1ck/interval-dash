
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartDataPoint {
  time: number;
  power: number | null;
  cadence: number | null;
  heart_rate: number | null;
}

interface FitDataChartProps {
  data: ChartDataPoint[];
}

const FitDataChart: React.FC<FitDataChartProps> = ({ data }) => {
  const [showPower, setShowPower] = useState(true);
  const [showCadence, setShowCadence] = useState(true);
  const [showHeartRate, setShowHeartRate] = useState(true);

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
    if (data.length === 0) return [];
    
    const maxTime = Math.max(...data.map(d => d.time));
    const ticks = [];
    
    for (let i = 0; i <= maxTime; i += 5) {
      ticks.push(i);
    }
    
    return ticks;
  };

  const xAxisTicks = generateTicks();

  // Custom tooltip component with color squares
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-gray-800 mb-2">
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
                <span className="text-sm font-medium text-gray-700">
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
    const values = data
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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 via-purple-500 to-red-500 rounded-full"></div>
          Données d'entraînement
        </CardTitle>
        <CardDescription>Évolution de la puissance, cadence et fréquence cardiaque dans le temps</CardDescription>
        
        {/* Chart Controls */}
        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="power"
              checked={showPower}
              onCheckedChange={setShowPower}
            />
            <label htmlFor="power" className="text-sm font-medium text-orange-600 cursor-pointer">
              Puissance
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cadence"
              checked={showCadence}
              onCheckedChange={setShowCadence}
            />
            <label htmlFor="cadence" className="text-sm font-medium text-purple-600 cursor-pointer">
              Cadence
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="heartRate"
              checked={showHeartRate}
              onCheckedChange={setShowHeartRate}
            />
            <label htmlFor="heartRate" className="text-sm font-medium text-red-600 cursor-pointer">
              Fréquence Cardiaque
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                yAxisId="left"
                className="text-gray-600"
                fontSize={11}
                label={{ 
                  value: 'Puissance (W) / Cadence (RPM)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b', fontSize: '11px' }
                }}
                tickLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                domain={[0, Math.max(...powerDomain, ...cadenceDomain)]}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-gray-600"
                fontSize={11}
                label={{ 
                  value: 'FC (BPM)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fill: '#64748b', fontSize: '11px' }
                }}
                tickLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                domain={heartRateDomain}
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
              
              {/* Power Line */}
              {showPower && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="power" 
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="Puissance (W)"
                  connectNulls={false}
                  fill="url(#powerGradient)"
                  activeDot={{ 
                    r: 4, 
                    stroke: "#f97316", 
                    strokeWidth: 2, 
                    fill: '#fff'
                  }}
                />
              )}
              
              {/* Cadence Line */}
              {showCadence && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cadence" 
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  name="Cadence (RPM)"
                  connectNulls={false}
                  fill="url(#cadenceGradient)"
                  activeDot={{ 
                    r: 4, 
                    stroke: "#a855f7", 
                    strokeWidth: 2, 
                    fill: '#fff'
                  }}
                />
              )}
              
              {/* Heart Rate Line */}
              {showHeartRate && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="heart_rate" 
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Fréquence Cardiaque (BPM)"
                  connectNulls={false}
                  fill="url(#heartRateGradient)"
                  activeDot={{ 
                    r: 4, 
                    stroke: "#ef4444", 
                    strokeWidth: 2, 
                    fill: '#fff'
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FitDataChart;
