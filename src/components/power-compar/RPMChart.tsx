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
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                strokeWidth={1}
                opacity={0.6}
              />
              <XAxis 
                dataKey="time" 
                className="text-gray-600"
                fontSize={12}
                tickFormatter={formatXAxisTick}
                ticks={xAxisTicks}
                domain={['dataMin', 'dataMax']}
                type="number"
                scale="linear"
                tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-gray-600"
                fontSize={12}
                label={{ 
                  value: 'RPM', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b', fontSize: '12px' }
                }}
                tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                domain={['dataMin - 5', 'dataMax + 5']}
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
                cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="rpm1" 
                stroke="#f59e0b"
                strokeWidth={3}
                dot={false}
                name={file1Name}
                connectNulls={false}
                fill="url(#rpmGradient1)"
                activeDot={{ 
                  r: 6, 
                  stroke: "#f59e0b", 
                  strokeWidth: 3, 
                  fill: '#fff',
                  filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rpm2" 
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
                name={file2Name}
                connectNulls={false}
                fill="url(#rpmGradient2)"
                activeDot={{ 
                  r: 6, 
                  stroke: "#ef4444", 
                  strokeWidth: 3, 
                  fill: '#fff',
                  filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))'
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