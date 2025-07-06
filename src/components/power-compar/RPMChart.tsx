
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

interface RPMChartProps {
  chartData: ChartDataPoint[];
  file1Name: string;
  file2Name: string;
}

const RPMChart: React.FC<RPMChartProps> = ({ chartData, file1Name, file2Name }) => {
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
  const getRpmDomain = () => {
    const rpmValues = chartData
      .flatMap(d => [d.rpm1, d.rpm2])
      .filter(v => v !== null && v !== undefined && !isNaN(v)) as number[];
    
    if (rpmValues.length === 0) return [0, 120];
    
    const min = Math.min(...rpmValues);
    const max = Math.max(...rpmValues);
    
    // Add padding
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  };

  const rpmDomain = getRpmDomain();

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
          Comparaison des données RPM
        </CardTitle>
        <CardDescription>Évolution de la cadence dans le temps pour les deux fichiers (lissage 3 secondes)</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="rpmGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rpmGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
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
                className="text-gray-600"
                fontSize={11}
                label={{ 
                  value: 'RPM', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b', fontSize: '11px' }
                }}
                tickLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                domain={rpmDomain}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <Tooltip 
                formatter={(value, name) => [
                  value ? `${Math.round(Number(value))} RPM` : 'N/A', 
                  name === 'rpm1' ? file1Name : file2Name
                ]}
                labelFormatter={(time) => `Temps: ${formatXAxisTick(Number(time))}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  fontSize: '12px'
                }}
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
                dataKey="rpm1" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name={file1Name}
                connectNulls={false}
                fill="url(#rpmGradient1)"
                activeDot={{ 
                  r: 4, 
                  stroke: "#f59e0b", 
                  strokeWidth: 2, 
                  fill: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rpm2" 
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name={file2Name}
                connectNulls={false}
                fill="url(#rpmGradient2)"
                activeDot={{ 
                  r: 4, 
                  stroke: "#ef4444", 
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

export default RPMChart;
