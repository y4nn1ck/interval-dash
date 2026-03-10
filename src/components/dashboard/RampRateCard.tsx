import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntervalsWeeklyStats } from '@/hooks/useIntervalsData';

const RampRateCard = () => {
  const { data: weeklyStats } = useIntervalsWeeklyStats();

  const rampRate = React.useMemo(() => {
    if (!weeklyStats || weeklyStats.length < 2) return null;
    const sorted = [...weeklyStats].sort((a, b) => a.date.localeCompare(b.date));
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    if (!oldest.ctl && !newest.ctl) return null;
    return Math.round(((newest.ctl || 0) - (oldest.ctl || 0)) * 10) / 10;
  }, [weeklyStats]);

  if (rampRate === null) return null;

  const isWarning = rampRate > 8;
  const isDanger = rampRate > 10;

  return (
    <Card className={cn(
      "glass-card overflow-hidden opacity-0 animate-fade-in-up",
      isDanger && "border-red-500/50",
      isWarning && !isDanger && "border-yellow-500/50"
    )} style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Vitesse de progression</p>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-3xl font-bold tracking-tight",
                isDanger ? "text-red-500" :
                isWarning ? "text-yellow-500" :
                "text-emerald-500"
              )}>
                {rampRate > 0 ? '+' : ''}{rampRate}
              </span>
              <span className="text-sm text-muted-foreground">pts/sem</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Évolution CTL sur 7 jours
            </p>
          </div>
          <div className={cn(
            "p-2.5 rounded-xl",
            isDanger ? "bg-red-500/20" :
            isWarning ? "bg-yellow-500/20" :
            "bg-emerald-500/20"
          )}>
            {isDanger ? (
              <ShieldAlert className="h-5 w-5 text-red-500" />
            ) : isWarning ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            )}
          </div>
        </div>

        {isDanger && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400 leading-relaxed">
                Attention, progression trop rapide pour les articulations. Risque de blessures (hanche, dos).
              </p>
            </div>
          </div>
        )}

        {isWarning && !isDanger && (
          <div className="mt-3 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-400 leading-relaxed">
                Progression rapide — surveillez vos sensations articulaires.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RampRateCard;
