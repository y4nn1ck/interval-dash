import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { IntervalsActivity, intervalsService } from '@/services/intervalsService';
import { parseProperFitFile } from '@/utils/properFitParser';
import { Loader2, Download, Calendar, Clock, Zap, Mountain, RotateCcw, Heart, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FitDataChart from '@/components/fit-analyzer/FitDataChart';
import TemperatureChart from '@/components/fit-analyzer/TemperatureChart';
import RouteMap from '@/components/fit-analyzer/RouteMap';
import ElevationChart from '@/components/fit-analyzer/ElevationChart';

interface ActivityAnalysisDialogProps {
  activity: IntervalsActivity | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ChartDataPoint {
  time: number;
  power: number | null;
  cadence: number | null;
  heart_rate: number | null;
}

interface TemperatureDataPoint {
  time: number;
  temperature: number | null;
  core_temperature: number | null;
  skin_temperature: number | null;
}

interface GpsPoint {
  lat: number;
  lng: number;
  time?: number;
  altitude?: number;
}

interface ElevationPoint {
  distance: number;
  altitude: number;
  lat?: number;
  lng?: number;
}

const getSportIcon = (type: string) => {
  const lowerType = (type || '').toLowerCase();
  if (lowerType.includes('ride') || lowerType.includes('cycling') || lowerType.includes('bike')) {
    return '🚴‍♂️';
  }
  if (lowerType.includes('run') || lowerType.includes('running')) {
    return '🏃‍♂️';
  }
  if (lowerType.includes('swim') || lowerType.includes('swimming')) {
    return '🏊‍♂️';
  }
  if (lowerType.includes('hike') || lowerType.includes('walk')) {
    return '🥾';
  }
  return '🏃‍♂️';
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes}min`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

const ActivityAnalysisDialog: React.FC<ActivityAnalysisDialogProps> = ({
  activity,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [temperatureData, setTemperatureData] = useState<TemperatureDataPoint[]>([]);
  const [gpsData, setGpsData] = useState<GpsPoint[]>([]);
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [analysisStats, setAnalysisStats] = useState<{
    avgPower?: number;
    maxPower?: number;
    avgCadence?: number;
    avgHeartRate?: number;
    maxHeartRate?: number;
    normalizedPower?: number;
  }>({});

  const handleAnalyze = async () => {
    if (!activity) return;

    setIsLoading(true);
    try {
      const fitBuffer = await intervalsService.getActivityFitFile(activity.id);
      
      if (!fitBuffer) {
        throw new Error('Impossible de récupérer le fichier FIT');
      }

      // Create a File object from the ArrayBuffer
      const blob = new Blob([fitBuffer], { type: 'application/octet-stream' });
      const file = new File([blob], `${activity.id}.fit`, { type: 'application/octet-stream' });

      const parsedData = await parseProperFitFile(file);

      // Extract records
      let extractedRecords: any[] = [];
      if (parsedData.rawDataStructure?.activity?.sessions?.[0]?.laps) {
        for (const lap of parsedData.rawDataStructure.activity.sessions[0].laps) {
          if (lap.records && Array.isArray(lap.records)) {
            extractedRecords = extractedRecords.concat(lap.records);
          }
        }
      }

      const trainingRecords = extractedRecords.filter(record => 
        record.elapsed_time !== undefined && record.elapsed_time >= 0
      );

      const recordsToUse = trainingRecords.length > 0 ? trainingRecords : parsedData.records;

      if (recordsToUse.length === 0) {
        throw new Error('Aucune donnée valide trouvée dans le fichier FIT');
      }

      // Calculate stats
      const powerRecords = recordsToUse.filter((r: any) => r.power && r.power > 0);
      const cadenceRecords = recordsToUse.filter((r: any) => r.cadence && r.cadence > 0);
      const heartRateRecords = recordsToUse.filter((r: any) => r.heart_rate && r.heart_rate > 0);

      setAnalysisStats({
        avgPower: powerRecords.length > 0 
          ? Math.round(powerRecords.reduce((sum: number, r: any) => sum + (r.power || 0), 0) / powerRecords.length)
          : undefined,
        maxPower: powerRecords.length > 0 
          ? Math.max(...powerRecords.map((r: any) => r.power || 0))
          : undefined,
        avgCadence: cadenceRecords.length > 0 
          ? Math.round(cadenceRecords.reduce((sum: number, r: any) => sum + (r.cadence || 0), 0) / cadenceRecords.length)
          : undefined,
        avgHeartRate: heartRateRecords.length > 0 
          ? Math.round(heartRateRecords.reduce((sum: number, r: any) => sum + (r.heart_rate || 0), 0) / heartRateRecords.length)
          : undefined,
        maxHeartRate: heartRateRecords.length > 0 
          ? Math.max(...heartRateRecords.map((r: any) => r.heart_rate || 0))
          : undefined,
        normalizedPower: parsedData.rawDataStructure?.activity?.sessions?.[0]?.normalized_power 
          ? Math.round(parsedData.rawDataStructure.activity.sessions[0].normalized_power)
          : undefined,
      });

      // Prepare chart data
      const chartPoints: ChartDataPoint[] = [];
      const tempPoints: TemperatureDataPoint[] = [];
      const gpsPoints: GpsPoint[] = [];
      const elevPoints: ElevationPoint[] = [];
      let cumulativeDistance = 0;

      recordsToUse.forEach((record: any, index: number) => {
        const relativeTime = (record.elapsed_time || index) / 60;

        chartPoints.push({
          time: relativeTime,
          power: record.power || null,
          cadence: record.cadence || null,
          heart_rate: record.heart_rate || null,
        });

        tempPoints.push({
          time: relativeTime,
          temperature: record.temperature || null,
          core_temperature: record.core_temperature || null,
          skin_temperature: record.skin_temperature || null,
        });

        if (record.position_lat && record.position_long) {
          if (gpsPoints.length > 0) {
            const prevPoint = gpsPoints[gpsPoints.length - 1];
            const lat1 = prevPoint.lat * Math.PI / 180;
            const lat2 = record.position_lat * Math.PI / 180;
            const deltaLat = (record.position_lat - prevPoint.lat) * Math.PI / 180;
            const deltaLng = (record.position_long - prevPoint.lng) * Math.PI / 180;

            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                      Math.cos(lat1) * Math.cos(lat2) *
                      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            cumulativeDistance += 6371 * c;
          }

          gpsPoints.push({
            lat: record.position_lat,
            lng: record.position_long,
            time: record.elapsed_time,
            altitude: record.altitude,
          });

          if (record.altitude && record.altitude > 0) {
            elevPoints.push({
              distance: cumulativeDistance,
              altitude: record.altitude,
              lat: record.position_lat,
              lng: record.position_long,
            });
          }
        }
      });

      setChartData(chartPoints);
      setTemperatureData(tempPoints);
      setGpsData(gpsPoints);
      setElevationData(elevPoints);
      setIsAnalyzed(true);

      toast({
        title: "Analyse terminée",
        description: `${recordsToUse.length} points de données analysés`,
      });
    } catch (error) {
      console.error('Error analyzing activity:', error);
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Impossible d'analyser l'activité",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsAnalyzed(false);
    setChartData([]);
    setTemperatureData([]);
    setGpsData([]);
    setElevationData([]);
    setAnalysisStats({});
    setHoveredPoint(null);
    onClose();
  };

  if (!activity) return null;

  const activityDate = parseISO(activity.start_date_local);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{getSportIcon(activity.type)}</span>
            <div className="flex flex-col">
              <span>{activity.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {format(activityDate, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="metric-card p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Durée</span>
            </div>
            <p className="text-lg font-bold">{formatDuration(activity.moving_time)}</p>
          </div>
          <div className="metric-card p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Distance</span>
            </div>
            <p className="text-lg font-bold">{formatDistance(activity.distance)}</p>
          </div>
          <div className="metric-card p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Mountain className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Dénivelé</span>
            </div>
            <p className="text-lg font-bold">{Math.round(activity.total_elevation_gain)}m</p>
          </div>
          {activity.icu_average_watts && (
            <div className="metric-card p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-muted-foreground">Puissance moy</span>
              </div>
              <p className="text-lg font-bold text-orange-400">{Math.round(activity.icu_average_watts)}W</p>
            </div>
          )}
          {activity.icu_training_load && (
            <div className="metric-card p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">TSS</span>
              </div>
              <p className="text-lg font-bold text-red-400">{Math.round(activity.icu_training_load)}</p>
            </div>
          )}
        </div>

        {/* Analysis Button or Results */}
        {!isAnalyzed ? (
          <div className="flex justify-center py-8">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              size="lg"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Analyser le fichier FIT
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Analysis Stats */}
            {(analysisStats.avgPower || analysisStats.avgHeartRate) && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {analysisStats.avgPower && (
                  <>
                    <div className="metric-card p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-orange-400" />
                        <span className="text-xs text-muted-foreground">Pwr Moy</span>
                      </div>
                      <p className="text-lg font-bold text-orange-400">{analysisStats.avgPower}W</p>
                    </div>
                    <div className="metric-card p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-orange-400" />
                        <span className="text-xs text-muted-foreground">Pwr Max</span>
                      </div>
                      <p className="text-lg font-bold">{analysisStats.maxPower}W</p>
                    </div>
                  </>
                )}
                {analysisStats.normalizedPower && (
                  <div className="metric-card p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-orange-400/70" />
                      <span className="text-xs text-muted-foreground">NP</span>
                    </div>
                    <p className="text-lg font-bold">{analysisStats.normalizedPower}W</p>
                  </div>
                )}
                {analysisStats.avgCadence && (
                  <div className="metric-card p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw className="h-4 w-4 text-purple-400" />
                      <span className="text-xs text-muted-foreground">Cadence</span>
                    </div>
                    <p className="text-lg font-bold text-purple-400">{analysisStats.avgCadence}</p>
                  </div>
                )}
                {analysisStats.avgHeartRate && (
                  <>
                    <div className="metric-card p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-muted-foreground">FC Moy</span>
                      </div>
                      <p className="text-lg font-bold text-red-400">{analysisStats.avgHeartRate}</p>
                    </div>
                    <div className="metric-card p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-muted-foreground">FC Max</span>
                      </div>
                      <p className="text-lg font-bold">{analysisStats.maxHeartRate}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Route Map */}
            {gpsData.length > 0 && (
              <RouteMap gpsData={gpsData} hoveredPoint={hoveredPoint} />
            )}

            {/* Elevation Chart */}
            {elevationData.length > 0 && (
              <ElevationChart 
                data={elevationData} 
                onHover={(point) => setHoveredPoint(point)}
              />
            )}

            {/* Temperature Chart */}
            {temperatureData.some(d => d.temperature || d.core_temperature || d.skin_temperature) && (
              <TemperatureChart data={temperatureData} />
            )}

            {/* Power/Cadence/HR Chart */}
            {chartData.length > 0 && (
              <FitDataChart 
                data={chartData} 
                zoomDomain={null}
                onResetZoom={() => {}}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityAnalysisDialog;
