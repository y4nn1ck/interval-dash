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
        return 'bg-red-500/20 border-red-500/30';
      case 'bg-green-500':
        return 'bg-green-500/20 border-green-500/30';
      case 'bg-orange-500':
        return 'bg-orange-500/20 border-orange-500/30';
      case 'bg-blue-500':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'bg-purple-500':
        return 'bg-purple-500/20 border-purple-500/30';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <Card className="glass-card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-4 rounded-2xl border-2 ${getIconBackgroundClass(color)} shadow-lg`}>
            <div className={`p-2 rounded-xl ${getGradientClass(color)} shadow-inner`}>
              <Icon className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
          </div>
          {trend && (
            <span className="text-sm font-semibold text-green-400 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
              {trend}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
            {unit && <span className="text-lg font-medium text-muted-foreground">{unit}</span>}
          </div>
          
          {goal && (
            <p className="text-sm text-muted-foreground font-medium">Objectif: {goal}</p>
          )}
          
          {progress !== undefined && (
            <div className="pt-3">
              <Progress value={progress} className="h-3 rounded-full" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">{Math.round(progress)}% de l'objectif</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
