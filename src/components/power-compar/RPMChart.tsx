
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des données RPM</CardTitle>
        <CardDescription>Évolution de la cadence dans le temps pour les deux fichiers (lissage 3 secondes)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                className="text-gray-600"
                fontSize={12}
                tickFormatter={(value) => `${Math.round(value)}min`}
              />
              <YAxis 
                className="text-gray-600"
                fontSize={12}
                label={{ value: 'RPM', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  value ? `${Math.round(Number(value))} RPM` : 'N/A', 
                  name === 'rpm1' ? file1Name : file2Name
                ]}
                labelFormatter={(time) => `Temps: ${Math.round(Number(time))}min`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rpm1" 
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name={file1Name}
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="rpm2" 
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name={file2Name}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RPMChart;
