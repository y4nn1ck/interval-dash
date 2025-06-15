
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  goal?: string;
  icon: LucideIcon;
  color: string;
  progress?: number;
  trend?: string;
}

const MetricCard = ({ title, value, unit, goal, icon: Icon, color, progress, trend }: MetricCardProps) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          {trend && (
            <span className="text-sm font-medium text-green-600">
              {trend}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-lg text-gray-500">{unit}</span>}
          </div>
          
          {goal && (
            <p className="text-sm text-gray-500">Goal: {goal}</p>
          )}
          
          {progress !== undefined && (
            <div className="pt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% of goal</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
