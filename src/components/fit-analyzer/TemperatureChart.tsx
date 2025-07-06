
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-gray-800 mb-2">
            Temps: {formatXAxisTick(Number(label))}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            
            let colorClass = '';
            let name = '';
            
            switch (entry.dataKey) {
              case 'temperature':
                colorClass = 'bg-yellow-500';
                name = 'Température';
                break;
              case 'core_temperature':
                colorClass = 'bg-red-500';
                name = 'Température Corporelle';
                break;
              case 'skin_temperature':
                colorClass = 'bg-orange-500';
                name = 'Température Peau';
                break;
            }
            
            return (
              <div key={index} className="flex items-center gap-2 py-1">
                <div className={`w-3 h-3 rounded-sm ${colorClass}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {name}: {Math.round(entry.value * 10) / 10}°C
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 via-orange-500 to-red-500 rounded-full"></div>
          Données de température
        </CardTitle>
        <CardDescription>Évolution de la température dans le temps</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="coreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="skinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
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
                  value: 'Température (°C)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b', fontSize: '11px' }
                }}
                tickLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                tickFormatter={(value) => `${Math.round(value)}°C`}
                domain={['dataMin - 2', 'dataMax + 2']}
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
              
              {/* Temperature Line */}
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
                name="Température"
                connectNulls={false}
                fill="url(#tempGradient)"
                activeDot={{ 
                  r: 4, 
                  stroke: "#eab308", 
                  strokeWidth: 2, 
                  fill: '#fff'
                }}
              />
              
              {/* Core Temperature Line */}
              <Line 
                type="monotone" 
                dataKey="core_temperature" 
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Température Corporelle"
                connectNulls={false}
                fill="url(#coreGradient)"
                activeDot={{ 
                  r: 4, 
                  stroke: "#ef4444", 
                  strokeWidth: 2, 
                  fill: '#fff'
                }}
              />
              
              {/* Skin Temperature Line */}
              <Line 
                type="monotone" 
                dataKey="skin_temperature" 
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Température Peau"
                connectNulls={false}
                fill="url(#skinGradient)"
                activeDot={{ 
                  r: 4, 
                  stroke: "#f97316", 
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

export default TemperatureChart;
