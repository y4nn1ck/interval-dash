import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, Flame, Loader2 } from 'lucide-react';
import { intervalsService } from '@/services/intervalsService';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';

interface DecouplingResult {
  activityId: string;
  name: string;
  date: string;
  type: string;
  decoupling: number;
  efA: number;
  efB: number;
}

const getDecouplingZone = (value: number) => {
  if (value < 5) return { label: 'Endurance stable', color: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.15)', border: 'hsl(var(--success) / 0.3)', icon: CheckCircle };
  if (value < 10) return { label: 'Dérive modérée', color: 'hsl(var(--power))', bg: 'hsl(var(--power) / 0.15)', border: 'hsl(var(--power) / 0.3)', icon: AlertTriangle };
  return { label: 'Manque d\'endurance', color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive) / 0.15)', border: 'hsl(var(--destructive) / 0.3)', icon: Flame };
};

const AerobicDecouplingCard = () => {
  const [results, setResults] = useState<DecouplingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestResult, setLatestResult] = useState<DecouplingResult | null>(null);

  useEffect(() => {
    const fetchDecouplingData = async () => {
      try {
        setLoading(true);
        const longActivities = await intervalsService.getLongActivities(10);

        if (longActivities.length === 0) {
          setLoading(false);
          return;
        }

        const decouplingResults: DecouplingResult[] = [];

        for (const activity of longActivities) {
          try {
            const streams = await intervalsService.getActivityStreams(activity.id);
            if (!streams || streams.watts.length === 0 || streams.heartrate.length === 0) continue;

            // Filter out zero values for clean calculation
            // Streams are 1 sample/sec — skip first 10 min (600s) of warmup
            const warmupSamples = 600;
            const paired = streams.watts.map((w, i) => ({
              watts: w,
              hr: streams.heartrate[i] || 0,
            })).filter(p => p.watts > 0 && p.hr > 0).slice(warmupSamples);

            if (paired.length < 20) continue;

            const mid = Math.floor(paired.length / 2);
            const partA = paired.slice(0, mid);
            const partB = paired.slice(mid);

            const avgWattsA = partA.reduce((s, p) => s + p.watts, 0) / partA.length;
            const avgHrA = partA.reduce((s, p) => s + p.hr, 0) / partA.length;
            const avgWattsB = partB.reduce((s, p) => s + p.watts, 0) / partB.length;
            const avgHrB = partB.reduce((s, p) => s + p.hr, 0) / partB.length;

            const efA = avgWattsA / avgHrA;
            const efB = avgWattsB / avgHrB;
            const decoupling = ((efA - efB) / efA) * 100;

            decouplingResults.push({
              activityId: activity.id,
              name: activity.name,
              date: activity.start_date_local?.split('T')[0] || '',
              type: activity.type,
              decoupling: Math.round(decoupling * 10) / 10,
              efA: Math.round(efA * 1000) / 1000,
              efB: Math.round(efB * 1000) / 1000,
            });
          } catch {
            // Skip activities where streams fail
          }
        }

        // Sort by date ascending for chart
        decouplingResults.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setResults(decouplingResults);
        if (decouplingResults.length > 0) {
          setLatestResult(decouplingResults[decouplingResults.length - 1]);
        }
      } catch (error) {
        console.error('Error computing aerobic decoupling:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDecouplingData();
  }, []);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex items-center justify-center gap-3 min-h-[200px]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Analyse du découplage aérobie...</span>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <span className="gradient-text">Découplage Aérobie</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Aucune sortie longue (&gt;60 min) avec puissance trouvée dans les 6 derniers mois.
          </p>
        </CardContent>
      </Card>
    );
  }

  const zone = latestResult ? getDecouplingZone(latestResult.decoupling) : null;
  const ZoneIcon = zone?.icon || CheckCircle;

  const chartData = results.map(r => ({
    date: new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    decoupling: r.decoupling,
    name: r.name,
  }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <span className="gradient-text">Découplage Aérobie</span>
          </div>
          {latestResult && zone && (
            <Badge
              className="text-xs font-bold border-0 px-3 py-1 rounded-full"
              style={{ backgroundColor: zone.bg, color: zone.color, border: `1px solid ${zone.border}` }}
            >
              <ZoneIcon className="w-3 h-3 mr-1" />
              {zone.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Latest result highlight */}
        {latestResult && zone && (
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: zone.bg, borderColor: zone.border }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{latestResult.name}</span>
              <span className="text-xs text-muted-foreground">{new Date(latestResult.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold" style={{ color: zone.color }}>
                {latestResult.decoupling > 0 ? '+' : ''}{latestResult.decoupling}%
              </span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Ef 1ère moitié : <strong className="text-foreground">{latestResult.efA.toFixed(3)}</strong></span>
              <span>Ef 2ème moitié : <strong className="text-foreground">{latestResult.efB.toFixed(3)}</strong></span>
            </div>
          </div>
        )}

        {/* Trend chart */}
        {results.length > 1 && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              Évolution sur les {results.length} dernières sorties longues
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Découplage']}
                  labelFormatter={(label) => label}
                />
                <ReferenceLine y={5} stroke="hsl(var(--power))" strokeDasharray="4 4" strokeOpacity={0.6} />
                <ReferenceLine y={10} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="decoupling"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(var(--accent))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--power))' }} /> 5% seuil modéré
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} /> 10% seuil critique
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AerobicDecouplingCard;
