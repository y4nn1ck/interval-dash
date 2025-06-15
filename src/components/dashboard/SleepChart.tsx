
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const SleepChart = () => {
  const data = [
    { date: '12/10', deep: 1.5, light: 4.2, rem: 1.8, awake: 0.3 },
    { date: '12/11', deep: 1.8, light: 3.9, rem: 2.1, awake: 0.2 },
    { date: '12/12', deep: 1.2, light: 4.5, rem: 1.5, awake: 0.4 },
    { date: '12/13', deep: 1.6, light: 4.1, rem: 1.9, awake: 0.2 },
    { date: '12/14', deep: 1.9, light: 3.8, rem: 2.2, awake: 0.1 },
    { date: '12/15', deep: 1.4, light: 4.3, rem: 1.7, awake: 0.3 },
    { date: '12/16', deep: 1.7, light: 4.0, rem: 2.0, awake: 0.2 },
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value, name) => [
              `${value}h`, 
              name === 'deep' ? 'Deep Sleep' :
              name === 'light' ? 'Light Sleep' :
              name === 'rem' ? 'REM Sleep' : 'Awake'
            ]}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Area
            type="monotone"
            dataKey="deep"
            stackId="1"
            stroke="#1e40af"
            fill="#1e40af"
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="light"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="rem"
            stackId="1"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.7}
          />
          <Area
            type="monotone"
            dataKey="awake"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepChart;
