
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
  const getGradientClass = (color: string) => {
    switch (color) {
      case 'bg-red-500':
        return 'bg-gradient-to-br from-red-400 to-red-600';
      case 'bg-green-500':
        return 'bg-gradient-to-br from-green-400 to-green-600';
      case 'bg-orange-500':
        return 'bg-gradient-to-br from-orange-400 to-orange-600';
      case 'bg-blue-500':
        return 'bg-gradient-to-br from-blue-400 to-blue-600';
      case 'bg-purple-500':
        return 'bg-gradient-to-br from-purple-400 to-purple-600';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  const getIconBackgroundClass = (color: string) => {
    switch (color) {
      case 'bg-red-500':
        return 'bg-red-50 border-red-100';
      case 'bg-green-500':
        return 'bg-green-50 border-green-100';
      case 'bg-orange-500':
        return 'bg-orange-50 border-orange-100';
      case 'bg-blue-500':
        return 'bg-blue-50 border-blue-100';
      case 'bg-purple-500':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-4 rounded-2xl border-2 ${getIconBackgroundClass(color)} shadow-lg`}>
            <div className={`p-2 rounded-xl ${getGradientClass(color)} shadow-inner`}>
              <Icon className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
          </div>
          {trend && (
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              {trend}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
            {unit && <span className="text-lg font-medium text-gray-500">{unit}</span>}
          </div>
          
          {goal && (
            <p className="text-sm text-gray-500 font-medium">Objectif: {goal}</p>
          )}
          
          {progress !== undefined && (
            <div className="pt-3">
              <Progress value={progress} className="h-3 rounded-full" />
              <p className="text-xs text-gray-500 mt-2 font-medium">{Math.round(progress)}% de l'objectif</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
