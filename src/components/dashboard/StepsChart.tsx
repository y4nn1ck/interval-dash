
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StepsChart = () => {
  const data = [
    { day: 'Mon', steps: 8543, goal: 10000 },
    { day: 'Tue', steps: 12234, goal: 10000 },
    { day: 'Wed', steps: 9876, goal: 10000 },
    { day: 'Thu', steps: 11543, goal: 10000 },
    { day: 'Fri', steps: 7234, goal: 10000 },
    { day: 'Sat', steps: 13456, goal: 10000 },
    { day: 'Sun', steps: 8743, goal: 10000 },
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={(value, name) => [value.toLocaleString(), name === 'steps' ? 'Steps' : 'Goal']}
            labelStyle={{ color: '#333' }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Bar dataKey="goal" fill="#e2e8f0" radius={[4, 4, 4, 4]} />
          <Bar dataKey="steps" fill="#3b82f6" radius={[4, 4, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StepsChart;
