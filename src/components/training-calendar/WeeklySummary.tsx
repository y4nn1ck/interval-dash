import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Target, Zap, TrendingUp as TrendUp } from 'lucide-react';
import { IntervalsActivity } from '@/services/intervalsService';

interface WeeklySummaryProps {
  activities: IntervalsActivity[];
}

const getSportIcon = (type: string) => {
  const lowerType = (type || '').toLowerCase();
  if (lowerType.includes('ride') || lowerType.includes('cycling') || lowerType.includes('bike')) return '🚴‍♂️';
  if (lowerType.includes('run') || lowerType.includes('running')) return '🏃‍♂️';
  if (lowerType.includes('swim') || lowerType.includes('swimming')) return '🏊‍♂️';
  if (lowerType.includes('hike') || lowerType.includes('walk')) return '🥾';
  if (lowerType.includes('weight') || lowerType.includes('strength')) return '💪';
  if (lowerType.includes('yoga')) return '🧘';
  return '🏃‍♂️';
};

const getSportLabel = (type: string) => {
  const lowerType = (type || '').toLowerCase();
  if (lowerType.includes('virtualride')) return 'Vélo (Home Trainer)';
  if (lowerType.includes('ride') || lowerType.includes('cycling') || lowerType.includes('bike')) return 'Vélo';
  if (lowerType.includes('run') || lowerType.includes('running')) return 'Course à pied';
  if (lowerType.includes('swim') || lowerType.includes('swimming')) return 'Natation';
  if (lowerType.includes('hike') || lowerType.includes('walk')) return 'Randonnée';
  if (lowerType.includes('weight') || lowerType.includes('strength')) return 'Renforcement';
  if (lowerType.includes('yoga')) return 'Yoga';
  return type;
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h${minutes.toString().padStart(2, '0')}`;
  return `${minutes}min`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
};

interface SportSummary {
  type: string;
  count: number;
  distance: number;
  duration: number;
  load: number;
}

const WeeklySummary = ({ activities }: WeeklySummaryProps) => {
  const sportBreakdown = useMemo(() => {
    const grouped: Record<string, SportSummary> = {};
    activities.forEach((a) => {
      const key = a.type || 'Other';
      if (!grouped[key]) {
        grouped[key] = { type: key, count: 0, distance: 0, duration: 0, load: 0 };
      }
      grouped[key].count++;
      grouped[key].distance += a.distance || 0;
      grouped[key].duration += a.moving_time || 0;
      grouped[key].load += a.icu_training_load || 0;
    });
    return Object.values(grouped).sort((a, b) => b.duration - a.duration);
  }, [activities]);

  // Get fitness metrics from last activity of the week (most recent CTL/ATL)
  const fitnessMetrics = useMemo(() => {
    const sorted = [...activities]
      .filter(a => (a as any).icu_ctl != null)
      .sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
    
    if (sorted.length > 0) {
      const last = sorted[0] as any;
      const ctl = Math.round(last.icu_ctl || 0);
      const atl = Math.round(last.icu_atl || 0);
      return { ctl, atl, tsb: ctl - atl };
    }
    return null;
  }, [activities]);

  const totals = useMemo(() => ({
    count: activities.length,
    duration: activities.reduce((sum, a) => sum + (a.moving_time || 0), 0),
    distance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
    elevation: activities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0),
    load: activities.reduce((sum, a) => sum + (a.icu_training_load || 0), 0),
  }), [activities]);

  if (activities.length === 0) return null;

  return (
    <>
      {/* Global Summary */}
      <Card className="glass-card opacity-0 animate-fade-in-up-delay-3">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Résumé de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="metric-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Activités</p>
              <p className="text-2xl font-bold text-foreground">{totals.count}</p>
            </div>
            <div className="metric-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Durée totale</p>
              <p className="text-2xl font-bold text-emerald-400">{formatDuration(totals.duration)}</p>
            </div>
            <div className="metric-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distance</p>
              <p className="text-2xl font-bold text-blue-400">{formatDistance(totals.distance)}</p>
            </div>
            <div className="metric-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dénivelé</p>
              <p className="text-2xl font-bold text-purple-400">{Math.round(totals.elevation)}m</p>
            </div>
            <div className="metric-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Charge (TSS)</p>
              <p className="text-2xl font-bold text-orange-400">{Math.round(totals.load)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sport Breakdown */}
      {sportBreakdown.length > 1 && (
        <Card className="glass-card opacity-0 animate-fade-in-up-delay-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Répartition par sport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sportBreakdown.map((sport) => (
                <div key={sport.type} className="metric-card p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{getSportIcon(sport.type)}</span>
                    <span className="font-semibold text-foreground">{getSportLabel(sport.type)}</span>
                    <span className="text-xs text-muted-foreground">({sport.count} activité{sport.count > 1 ? 's' : ''})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distance</p>
                      <p className="text-lg font-bold text-blue-400">
                        {sport.distance > 0 ? formatDistance(sport.distance) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Durée</p>
                      <p className="text-lg font-bold text-emerald-400">{formatDuration(sport.duration)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Charge (TSS)</p>
                      <p className="text-lg font-bold text-orange-400">{Math.round(sport.load)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fitness Metrics */}
      {fitnessMetrics && (
        <Card className="glass-card opacity-0 animate-fade-in-up-delay-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Condition physique de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="metric-card p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-green-400" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Fitness (CTL)</p>
                </div>
                <p className="text-2xl font-bold text-green-400">{fitnessMetrics.ctl}</p>
              </div>
              <div className="metric-card p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-orange-400" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Fatigue (ATL)</p>
                </div>
                <p className="text-2xl font-bold text-orange-400">{fitnessMetrics.atl}</p>
              </div>
              <div className="metric-card p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendUp className="h-4 w-4 text-blue-400" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Forme (TSB)</p>
                </div>
                <p className={`text-2xl font-bold ${fitnessMetrics.tsb >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {fitnessMetrics.tsb}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default WeeklySummary;
