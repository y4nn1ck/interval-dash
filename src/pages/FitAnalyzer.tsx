import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { parseProperFitFile } from '@/utils/properFitParser';
import { useToast } from '@/hooks/use-toast';
import { Upload, Calendar, Clock, Zap, RotateCcw, Heart, Thermometer } from 'lucide-react';
import FitDataChart from '@/components/fit-analyzer/FitDataChart';
import TemperatureChart from '@/components/fit-analyzer/TemperatureChart';
import RouteMap from '@/components/fit-analyzer/RouteMap';
import { format } from 'date-fns';

interface FitRecord {
  timestamp?: number;
  power?: number;
  cadence?: number;
  heart_rate?: number;
  elapsed_time?: number;
  temperature?: number;
  core_temperature?: number;
  skin_temperature?: number;
  position_lat?: number;
  position_long?: number;
}

interface LapData {
  lapNumber: number;
  startTime: string;
  duration: string;
  avgPower: number;
  maxPower: number;
  avgCadence: number;
  maxCadence: number;
  avgHeartRate: number;
  maxHeartRate: number;
  normalizedPower?: number;
  startTimeMinutes: number;
  durationMinutes: number;
}

interface FitFileInfo {
  fileName: string;
  sportType: string;
  startDate: string;
  startTime: string;
  duration: number; // in minutes
  avgPower: number;
  maxPower: number;
  avgCadence: number;
  maxCadence: number;
  avgHeartRate: number;
  maxHeartRate: number;
  normalizedPower?: number;
  avgTemperature?: number;
  maxTemperature?: number;
  minTemperature?: number;
  hasTemperatureData?: boolean;
  hasCoreTemperatureData?: boolean;
  avgCoreTemperature?: number;
  avgSkinTemperature?: number;
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
}

const FitAnalyzer = () => {
  const [fileInfo, setFileInfo] = useState<FitFileInfo | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [temperatureData, setTemperatureData] = useState<TemperatureDataPoint[]>([]);
  const [lapData, setLapData] = useState<LapData[]>([]);
  const [gpsData, setGpsData] = useState<GpsPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const { toast } = useToast();

  const getSportIcon = (sportType: string) => {
    const lowerType = (sportType || '').toLowerCase();
    if (lowerType.includes('cycling') || lowerType.includes('bike') || lowerType.includes('vélo')) {
      return '🚴‍♂️';
    }
    if (lowerType.includes('running') || lowerType.includes('course') || lowerType.includes('run')) {
      return '🏃‍♂️';
    }
    if (lowerType.includes('swimming') || lowerType.includes('natation') || lowerType.includes('swim')) {
      return '🏊‍♂️';
    }
    if (lowerType.includes('hiking') || lowerType.includes('randonnée') || lowerType.includes('mountain')) {
      return '🥾';
    }
    if (lowerType.includes('strength') || lowerType.includes('musculation') || lowerType.includes('weight')) {
      return '💪';
    }
    return '🏃‍♂️'; // Default icon
  };

  const getSportName = (sportType: string) => {
    const lowerType = (sportType || '').toLowerCase();
    if (lowerType.includes('cycling') || lowerType.includes('bike') || lowerType.includes('vélo')) {
      return 'Vélo';
    }
    if (lowerType.includes('running') || lowerType.includes('course') || lowerType.includes('run')) {
      return 'Course à Pied';
    }
    if (lowerType.includes('swimming') || lowerType.includes('natation') || lowerType.includes('swim')) {
      return 'Natation';
    }
    if (lowerType.includes('hiking') || lowerType.includes('randonnée') || lowerType.includes('mountain')) {
      return 'Randonnée';
    }
    if (lowerType.includes('strength') || lowerType.includes('musculation') || lowerType.includes('weight')) {
      return 'Musculation';
    }
    return sportType || 'Sport'; // Fallback to original or generic
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    
    // Handle nested timestamp structure (like timestamp.value.iso)
    if (timestamp && typeof timestamp === 'object') {
      if (timestamp.value && timestamp.value.iso) {
        try {
          const date = new Date(timestamp.value.iso);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          console.log('Error parsing nested timestamp:', e);
        }
      }
    }
    
    // Handle direct ISO string format (like "2025-07-01T16:03:24.000Z")
    if (typeof timestamp === 'string') {
      try {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        console.log('Error parsing string timestamp:', e);
      }
    }
    
    // Handle direct Date object
    if (timestamp instanceof Date) {
      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    }
    
    // Handle direct number (Unix timestamp)
    if (typeof timestamp === 'number') {
      try {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        console.log('Error parsing number timestamp:', e);
      }
    }
    
    return null;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}m${remainingSeconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m${remainingSeconds.toString().padStart(2, '0')}s`;
  };

  const formatDurationMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    }
    return `${remainingMinutes}min`;
  };

  // Parse lap duration string to minutes
  const parseLapDuration = (duration: string): number => {
    const match = duration.match(/(\d+)h(\d+)m(\d+)s|(\d+)m(\d+)s/);
    if (match) {
      if (match[1]) {
        // Format: XhYmZs
        return parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 60;
      } else {
        // Format: YmZs
        return parseInt(match[4]) + parseInt(match[5]) / 60;
      }
    }
    return 0;
  };

  // Handle lap click to zoom chart
  const handleLapClick = (lap: LapData) => {
    const startTime = lap.startTimeMinutes;
    const endTime = startTime + lap.durationMinutes;
    setZoomDomain([startTime, endTime]);
  };

  // Reset zoom
  const resetZoom = () => {
    setZoomDomain(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      console.log(`Analyzing FIT file: ${file.name}`);
      const parsedData = await parseProperFitFile(file);
      
      // Extract records from nested structure
      let extractedRecords: FitRecord[] = [];
      if (parsedData.rawDataStructure?.activity?.sessions?.[0]?.laps) {
        for (const lap of parsedData.rawDataStructure.activity.sessions[0].laps) {
          if (lap.records && Array.isArray(lap.records)) {
            extractedRecords = extractedRecords.concat(lap.records);
          }
        }
      }
      
      // Filter records starting from elapsed_time: 0 (start of training)
      const trainingRecords = extractedRecords.filter(record => 
        record.elapsed_time !== undefined && record.elapsed_time >= 0
      );
      
      const recordsToUse = trainingRecords.length > 0 ? trainingRecords : parsedData.records;
      
      if (recordsToUse.length === 0) {
        throw new Error('No valid data found in FIT file');
      }

      // Get first record with timestamp for start date/time
      const firstRecordWithTimestamp = recordsToUse.find(r => r.timestamp);
      let startDate = 'N/A';
      let startTime = 'N/A';
      let calculatedDuration = 0;
      
      if (firstRecordWithTimestamp?.timestamp) {
        const firstDate = formatTimestamp(firstRecordWithTimestamp.timestamp);
        if (firstDate) {
          startDate = format(firstDate, 'dd/MM/yyyy');
          startTime = format(firstDate, 'HH:mm:ss');
          
          // Calculate duration from first to last timestamp
          const lastRecordWithTimestamp = recordsToUse.filter(r => r.timestamp).pop();
          if (lastRecordWithTimestamp?.timestamp) {
            const lastDate = formatTimestamp(lastRecordWithTimestamp.timestamp);
            if (lastDate) {
              calculatedDuration = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60); // in minutes
            }
          }
        }
      }

      // Calculate statistics
      const powerRecords = recordsToUse.filter(r => r.power && r.power > 0);
      const cadenceRecords = recordsToUse.filter(r => r.cadence && r.cadence > 0);
      const heartRateRecords = recordsToUse.filter(r => r.heart_rate && r.heart_rate > 0);

      const avgPower = powerRecords.length > 0 
        ? Math.round(powerRecords.reduce((sum, r) => sum + (r.power || 0), 0) / powerRecords.length)
        : 0;
      
      const maxPower = powerRecords.length > 0 
        ? Math.max(...powerRecords.map(r => r.power || 0))
        : 0;

      const avgCadence = cadenceRecords.length > 0 
        ? Math.round(cadenceRecords.reduce((sum, r) => sum + (r.cadence || 0), 0) / cadenceRecords.length)
        : 0;
      
      const maxCadence = cadenceRecords.length > 0 
        ? Math.max(...cadenceRecords.map(r => r.cadence || 0))
        : 0;

      const avgHeartRate = heartRateRecords.length > 0 
        ? Math.round(heartRateRecords.reduce((sum, r) => sum + (r.heart_rate || 0), 0) / heartRateRecords.length)
        : 0;
      
      const maxHeartRate = heartRateRecords.length > 0 
        ? Math.max(...heartRateRecords.map(r => r.heart_rate || 0))
        : 0;

      // Calculate temperature statistics
      const temperatureRecords = recordsToUse.filter(r => 
        (r.temperature && r.temperature > 0) || 
        (r.core_temperature && r.core_temperature > 0) || 
        (r.skin_temperature && r.skin_temperature > 0)
      );
      
      let avgTemperature = 0;
      let maxTemperature = 0;
      let minTemperature = 0;
      let hasTemperatureData = false;
      let hasCoreTemperatureData = false;
      let avgCoreTemperature = 0;
      let avgSkinTemperature = 0;
      
      if (temperatureRecords.length > 0) {
        // Collect all temperature values
        const allTemps: number[] = [];
        const coreTemps: number[] = [];
        const skinTemps: number[] = [];
        
        temperatureRecords.forEach(r => {
          if (r.temperature && r.temperature > 0) allTemps.push(r.temperature);
          if (r.core_temperature && r.core_temperature > 0) allTemps.push(r.core_temperature);
          if (r.skin_temperature && r.skin_temperature > 0) allTemps.push(r.skin_temperature);
          
          // Separate core and skin temperatures
          if (r.core_temperature && r.core_temperature > 0) coreTemps.push(r.core_temperature);
          if (r.skin_temperature && r.skin_temperature > 0) skinTemps.push(r.skin_temperature);
        });
        
        if (allTemps.length > 0) {
          avgTemperature = Math.round((allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length) * 10) / 10;
          maxTemperature = Math.round(Math.max(...allTemps) * 10) / 10;
          minTemperature = Math.round(Math.min(...allTemps) * 10) / 10;
          hasTemperatureData = true;
        }
        
        if (coreTemps.length > 0 || skinTemps.length > 0) {
          hasCoreTemperatureData = true;
          if (coreTemps.length > 0) {
            avgCoreTemperature = Math.round((coreTemps.reduce((sum, temp) => sum + temp, 0) / coreTemps.length) * 10) / 10;
          }
          if (skinTemps.length > 0) {
            avgSkinTemperature = Math.round((skinTemps.reduce((sum, temp) => sum + temp, 0) / skinTemps.length) * 10) / 10;
          }
        }
      }

      // Get Normalized Power from parsed data if available
      let normalizedPower: number | undefined;
      if (parsedData.rawDataStructure?.activity?.sessions?.[0]?.normalized_power) {
        normalizedPower = Math.round(parsedData.rawDataStructure.activity.sessions[0].normalized_power);
      }

      // Extract sport type from parsed data
      let sportType: string = 'Sport';
      if (parsedData.rawDataStructure?.activity?.sessions?.[0]?.sport) {
        const sport = parsedData.rawDataStructure.activity.sessions[0].sport;
        sportType = typeof sport === 'string' ? sport : 'Sport';
      } else if (parsedData.rawDataStructure?.activity?.sport) {
        const sport = parsedData.rawDataStructure.activity.sport;
        sportType = typeof sport === 'string' ? sport : 'Sport';
      } else if (parsedData.rawDataStructure?.sessions?.[0]?.sport) {
        const sport = parsedData.rawDataStructure.sessions[0].sport;
        sportType = typeof sport === 'string' ? sport : 'Sport';
      }

      // Create file info
      const info: FitFileInfo = {
        fileName: file.name,
        sportType,
        startDate,
        startTime,
        duration: calculatedDuration,
        avgPower,
        maxPower,
        avgCadence,
        maxCadence,
        avgHeartRate,
        maxHeartRate,
        normalizedPower,
        avgTemperature,
        maxTemperature,
        minTemperature,
        hasTemperatureData,
        hasCoreTemperatureData,
        avgCoreTemperature,
        avgSkinTemperature
      };

      setFileInfo(info);

      // Process lap data
      const laps: LapData[] = [];
      let cumulativeTime = 0;
      
      if (parsedData.rawDataStructure?.activity?.sessions?.[0]?.laps && Array.isArray(parsedData.rawDataStructure.activity.sessions[0].laps)) {
        parsedData.rawDataStructure.activity.sessions[0].laps.forEach((lap: any, index: number) => {
          if (lap.start_time) {
            const lapStartDate = formatTimestamp(lap.start_time);
            const lapStartTime = lapStartDate ? format(lapStartDate, 'HH:mm:ss') : 'N/A';
            const lapDurationSeconds = lap.total_elapsed_time || 0;
            const lapDurationMinutes = lapDurationSeconds / 60;
            
            laps.push({
              lapNumber: index + 1,
              startTime: lapStartTime,
              duration: formatDuration(lapDurationSeconds),
              avgPower: Math.round(lap.avg_power || 0),
              maxPower: Math.round(lap.max_power || 0),
              avgCadence: Math.round(lap.avg_cadence || 0),
              maxCadence: Math.round(lap.max_cadence || 0),
              avgHeartRate: Math.round(lap.avg_heart_rate || 0),
              maxHeartRate: Math.round(lap.max_heart_rate || 0),
              normalizedPower: lap.normalized_power ? Math.round(lap.normalized_power) : undefined,
              startTimeMinutes: cumulativeTime,
              durationMinutes: lapDurationMinutes
            });
            
            cumulativeTime += lapDurationMinutes;
          }
        });
      }
      
      setLapData(laps);

      // Prepare chart data
      const chartPoints: ChartDataPoint[] = [];
      const tempPoints: TemperatureDataPoint[] = [];
      const firstTimestamp = firstRecordWithTimestamp?.timestamp ? formatTimestamp(firstRecordWithTimestamp.timestamp)?.getTime() : 0;
      
      recordsToUse.forEach((record, index) => {
        let relativeTime = index / 60; // fallback to index-based time in minutes
        
        if (record.timestamp && firstTimestamp) {
          const recordDate = formatTimestamp(record.timestamp);
          if (recordDate) {
            const recordTime = recordDate.getTime();
            relativeTime = (recordTime - firstTimestamp) / (1000 * 60); // Convert to minutes
          }
        }
        
        chartPoints.push({
          time: relativeTime,
          power: record.power || null,
          cadence: record.cadence || null,
          heart_rate: record.heart_rate || null
        });

        // Prepare temperature data
        tempPoints.push({
          time: relativeTime,
          temperature: record.temperature || null,
          core_temperature: record.core_temperature || null,
          skin_temperature: record.skin_temperature || null
        });
      });

      setChartData(chartPoints);
      setTemperatureData(tempPoints);

      // Extract GPS data
      const gpsPoints: GpsPoint[] = [];
      recordsToUse.forEach((record: FitRecord) => {
        if (record.position_lat && record.position_long) {
          gpsPoints.push({
            lat: record.position_lat,
            lng: record.position_long,
            time: record.elapsed_time
          });
        }
      });
      setGpsData(gpsPoints);
      console.log(`Extracted ${gpsPoints.length} GPS points`);
      
      toast({
        title: "Fichier analysé avec succès",
        description: `${file.name} - ${recordsToUse.length} points de données`,
      });
      
    } catch (error) {
      console.error('Error analyzing FIT file:', error);
      toast({
        title: "Erreur lors de l'analyse",
        description: `Impossible d'analyser le fichier ${file.name}: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 opacity-0 animate-fade-in-up">
        <h1 className="text-4xl font-bold gradient-text">FIT Analyzer</h1>
        <p className="text-muted-foreground text-lg">Analysez en détail vos fichiers FIT avec des graphiques interactifs</p>
      </div>

      {/* File Upload Section */}
      <Card className="glass-card glow border-primary/20 opacity-0 animate-fade-in-up-delay-1">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/20">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            Télécharger un fichier FIT
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sélectionnez un fichier FIT pour une analyse détaillée avec graphiques interactifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".fit"
              onChange={handleFileUpload}
              className="flex-1 bg-secondary/50 border-border/50 file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:cursor-pointer hover:file:bg-primary/80 transition-all"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="glass-card animate-fade-in-scale">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              </div>
              <p className="text-muted-foreground">Analyse du fichier FIT en cours...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Information Card */}
      {fileInfo && (
        <Card className="glass-card overflow-hidden opacity-0 animate-fade-in-up-delay-1">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-cyan-400"></div>
              Informations de l'entraînement
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              {fileInfo.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Sport Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-cyan-500/20 border border-primary/30">
                <span className="text-2xl">{getSportIcon(fileInfo.sportType)}</span>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Sport</p>
                  <p className="text-lg font-bold text-foreground">{getSportName(fileInfo.sportType)}</p>
                </div>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Date & Time */}
              <div className="metric-card rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Date</span>
                </div>
                <p className="text-lg font-bold text-foreground">{fileInfo.startDate}</p>
                <p className="text-sm text-muted-foreground">{fileInfo.startTime}</p>
              </div>

              {/* Duration */}
              <div className="metric-card rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Durée</span>
                </div>
                <p className="text-lg font-bold text-foreground">{formatDurationMinutes(fileInfo.duration)}</p>
              </div>

              {/* Power */}
              <div className="metric-card rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Puissance</span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-orange-400">{fileInfo.avgPower}W <span className="text-xs text-muted-foreground font-normal">moy</span></p>
                  <p className="text-sm text-foreground">{fileInfo.maxPower}W <span className="text-xs text-muted-foreground">max</span></p>
                  {fileInfo.normalizedPower && (
                    <p className="text-sm text-muted-foreground">{fileInfo.normalizedPower}W <span className="text-xs">NP</span></p>
                  )}
                </div>
              </div>

              {/* Cadence */}
              <div className="metric-card rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Cadence</span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-purple-400">{fileInfo.avgCadence} <span className="text-xs text-muted-foreground font-normal">moy</span></p>
                  <p className="text-sm text-foreground">{fileInfo.maxCadence} <span className="text-xs text-muted-foreground">max</span></p>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="metric-card rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">FC</span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-red-400">{fileInfo.avgHeartRate} <span className="text-xs text-muted-foreground font-normal">moy</span></p>
                  <p className="text-sm text-foreground">{fileInfo.maxHeartRate} <span className="text-xs text-muted-foreground">max</span></p>
                </div>
              </div>

              {/* Temperature */}
              {fileInfo.hasTemperatureData && (
                <div className="metric-card rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Temp</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-yellow-400">{fileInfo.avgTemperature}°C <span className="text-xs text-muted-foreground font-normal">moy</span></p>
                    <p className="text-sm text-foreground">{fileInfo.maxTemperature}°C <span className="text-xs text-muted-foreground">max</span></p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Map */}
      {gpsData.length > 0 && (
        <div className="opacity-0 animate-fade-in-up-delay-2">
          <RouteMap gpsData={gpsData} />
        </div>
      )}

      {/* Temperature Chart */}
      {temperatureData.length > 0 && temperatureData.some(d => d.temperature || d.core_temperature || d.skin_temperature) && (
        <div className="opacity-0 animate-fade-in-up-delay-3">
          <TemperatureChart data={temperatureData} />
        </div>
      )}

      {/* Interactive Chart */}
      {chartData.length > 0 && (
        <div className="opacity-0 animate-fade-in-up-delay-4">
          <FitDataChart 
            data={chartData} 
            zoomDomain={zoomDomain}
            onResetZoom={resetZoom}
          />
        </div>
      )}

      {/* Laps Table */}
      {lapData.length > 0 && (
        <Card className="glass-card overflow-hidden opacity-0 animate-fade-in-up-delay-5">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-cyan-400"></div>
              Tours / Intervalles
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Cliquez sur une ligne pour zoomer sur l'intervalle dans le graphique
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-center text-muted-foreground">Tour</TableHead>
                  <TableHead className="text-center text-muted-foreground">Heure</TableHead>
                  <TableHead className="text-center text-muted-foreground">Durée</TableHead>
                  <TableHead className="text-center text-orange-400">Pwr Moy</TableHead>
                  <TableHead className="text-center text-orange-400">Pwr Max</TableHead>
                  <TableHead className="text-center text-orange-400/70">NP</TableHead>
                  <TableHead className="text-center text-purple-400">Cad Moy</TableHead>
                  <TableHead className="text-center text-purple-400">Cad Max</TableHead>
                  <TableHead className="text-center text-red-400">FC Moy</TableHead>
                  <TableHead className="text-center text-red-400">FC Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lapData.map((lap, index) => (
                  <TableRow 
                    key={lap.lapNumber}
                    className="cursor-pointer border-border/30 hover:bg-primary/10 transition-all duration-200"
                    onClick={() => handleLapClick(lap)}
                    title="Cliquer pour zoomer sur cet intervalle"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="text-center font-bold text-primary">{lap.lapNumber}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{lap.startTime}</TableCell>
                    <TableCell className="text-center font-medium">{lap.duration}</TableCell>
                    <TableCell className="text-center font-medium text-orange-400">{lap.avgPower}W</TableCell>
                    <TableCell className="text-center text-foreground">{lap.maxPower}W</TableCell>
                    <TableCell className="text-center text-muted-foreground">{lap.normalizedPower ? `${lap.normalizedPower}W` : '-'}</TableCell>
                    <TableCell className="text-center font-medium text-purple-400">{lap.avgCadence}</TableCell>
                    <TableCell className="text-center text-foreground">{lap.maxCadence}</TableCell>
                    <TableCell className="text-center font-medium text-red-400">{lap.avgHeartRate}</TableCell>
                    <TableCell className="text-center text-foreground">{lap.maxHeartRate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FitAnalyzer;