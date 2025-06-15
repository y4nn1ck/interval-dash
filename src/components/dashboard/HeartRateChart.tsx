
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const HeartRateChart = () => {
  const data = [
    { name: 'Zone 1 (Recovery)', value: 25, color: '#10b981' },
    { name: 'Zone 2 (Base)', value: 35, color: '#3b82f6' },
    { name: 'Zone 3 (Aerobic)', value: 20, color: '#f59e0b' },
    { name: 'Zone 4 (Threshold)', value: 15, color: '#ef4444' },
    { name: 'Zone 5 (Anaerobic)', value: 5, color: '#8b5cf6' },
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Time']}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeartRateChart;
