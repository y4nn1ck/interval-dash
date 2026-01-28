import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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

  const getGlowColor = (color: string) => {
    switch (color) {
      case 'bg-red-500':
        return 'before:bg-red-500/20 hover:before:bg-red-500/30';
      case 'bg-green-500':
        return 'before:bg-green-500/20 hover:before:bg-green-500/30';
      case 'bg-orange-500':
        return 'before:bg-orange-500/20 hover:before:bg-orange-500/30';
      case 'bg-blue-500':
        return 'before:bg-blue-500/20 hover:before:bg-blue-500/30';
      case 'bg-purple-500':
        return 'before:bg-purple-500/20 hover:before:bg-purple-500/30';
      default:
        return 'before:bg-primary/20 hover:before:bg-primary/30';
    }
  };

  return (
    <Card 
      className={cn(
        "glass-card relative overflow-hidden transition-all duration-500 hover:-translate-y-1",
        "before:absolute before:inset-0 before:-z-10 before:blur-2xl before:transition-all before:duration-500",
        "before:animate-pulse before:opacity-60 hover:before:opacity-100",
        "hover:shadow-2xl hover:border-primary/30",
        "after:absolute after:inset-0 after:-z-20 after:bg-gradient-to-br after:from-transparent after:to-primary/5",
        getGlowColor(color)
      )}
    >
      {/* Animated glow ring */}
      <div 
        className={cn(
          "absolute -inset-0.5 -z-10 rounded-xl opacity-0 blur-sm transition-opacity duration-500",
          "bg-gradient-to-r from-primary via-purple-500 to-primary",
          "group-hover:opacity-50 animate-glow-pulse"
        )}
        style={{
          background: `linear-gradient(45deg, transparent, hsl(var(--primary) / 0.3), transparent)`,
          animation: 'glow-pulse 3s ease-in-out infinite'
        }}
      />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-4 rounded-2xl border-2 shadow-lg transition-all duration-300",
            "hover:scale-105 hover:shadow-xl",
            getIconBackgroundClass(color)
          )}>
            <div className={cn(
              "p-2 rounded-xl shadow-inner transition-transform duration-300",
              getGradientClass(color)
            )}>
              <Icon className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
          </div>
          {trend && (
            <span className="text-sm font-semibold text-green-400 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30 animate-pulse">
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
