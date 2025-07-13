import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { parseProperFitFile } from '@/utils/properFitParser';
import { useToast } from '@/hooks/use-toast';
import { Upload, Calendar, Clock, Zap, RotateCcw, Heart, Thermometer } from 'lucide-react';
import FitDataChart from '@/components/fit-analyzer/FitDataChart';
import TemperatureChart from '@/components/fit-analyzer/TemperatureChart';
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

const FitAnalyzer = () => {
  const [fileInfo, setFileInfo] = useState<FitFileInfo | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [temperatureData, setTemperatureData] = useState<TemperatureDataPoint[]>([]);
  const [lapData, setLapData] = useState<LapData[]>([]);
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">FIT Analyzer</h1>
        <p className="text-muted-foreground">Analysez en détail vos fichiers FIT avec des graphiques interactifs</p>
      </div>

      {/* File Upload Section */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-500" />
            Télécharger un fichier FIT
          </CardTitle>
          <CardDescription>Sélectionnez un fichier FIT pour une analyse détaillée avec graphiques interactifs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".fit"
              onChange={handleFileUpload}
              className="flex-1"
              disabled={isLoading}
            />
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <p>Analyse du fichier FIT en cours...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Information Card */}
      {fileInfo && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
              Informations du fichier
            </CardTitle>
            <CardDescription className="text-xs">{fileInfo.fileName}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* First row - Sport only */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <span className="text-lg">{getSportIcon(fileInfo.sportType)}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Sport</p>
                  <p className="text-xs font-bold text-indigo-700">{getSportName(fileInfo.sportType)}</p>
                </div>
              </div>
            </div>
            
            {/* Second row - All other metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {/* Date & Time */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Date & Heure</p>
                  <p className="text-xs font-bold text-blue-700">{fileInfo.startDate}</p>
                  <p className="text-xs text-blue-600">{fileInfo.startTime}</p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Durée</p>
                  <p className="text-xs font-bold text-green-700">{formatDurationMinutes(fileInfo.duration)}</p>
                </div>
              </div>

              {/* Power */}
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Puissance</p>
                  <p className="text-xs font-bold text-orange-700">Moy: {fileInfo.avgPower}W</p>
                  <p className="text-xs font-bold text-orange-700">Max: {fileInfo.maxPower}W</p>
                  {fileInfo.normalizedPower && (
                    <p className="text-xs text-orange-600">NP: {fileInfo.normalizedPower}W</p>
                  )}
                </div>
              </div>

              {/* Cadence */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Cadence</p>
                  <p className="text-xs font-bold text-purple-700">Moy: {fileInfo.avgCadence} RPM</p>
                  <p className="text-xs font-bold text-purple-700">Max: {fileInfo.maxCadence} RPM</p>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Fréquence Cardiaque</p>
                  <p className="text-xs font-bold text-red-700">Moy: {fileInfo.avgHeartRate} BPM</p>
                  <p className="text-xs font-bold text-red-700">Max: {fileInfo.maxHeartRate} BPM</p>
                </div>
              </div>

              {/* Temperature - Only show if temperature data is available */}
              {fileInfo.hasTemperatureData && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Thermometer className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Température</p>
                    <p className="text-xs font-bold text-yellow-700">Moy: {fileInfo.avgTemperature}°C</p>
                    <p className="text-xs font-bold text-yellow-700">Max: {fileInfo.maxTemperature}°C</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temperature Chart */}
      {temperatureData.length > 0 && temperatureData.some(d => d.temperature || d.core_temperature || d.skin_temperature) && (
        <TemperatureChart data={temperatureData} />
      )}

      {/* Interactive Chart */}
      {chartData.length > 0 && (
        <FitDataChart 
          data={chartData} 
          zoomDomain={zoomDomain}
          onResetZoom={resetZoom}
        />
      )}

      {/* Laps Table */}
      {lapData.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
              Tours / Intervalles
            </CardTitle>
            <CardDescription>Détail de chaque tour ou intervalle de l'entraînement</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Cliquez sur une ligne pour zoomer sur l'intervalle dans le graphique</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Tour</TableHead>
                  <TableHead className="text-center">Heure</TableHead>
                  <TableHead className="text-center">Durée</TableHead>
                  <TableHead className="text-center">Puissance Moy</TableHead>
                  <TableHead className="text-center">Puissance Max</TableHead>
                  <TableHead className="text-center">NP</TableHead>
                  <TableHead className="text-center">Cadence Moy</TableHead>
                  <TableHead className="text-center">Cadence Max</TableHead>
                  <TableHead className="text-center">FC Moy</TableHead>
                  <TableHead className="text-center">FC Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lapData.map((lap) => (
                  <TableRow 
                    key={lap.lapNumber}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleLapClick(lap)}
                    title="Cliquer pour zoomer sur cet intervalle"
                  >
                    <TableCell className="text-center font-medium">{lap.lapNumber}</TableCell>
                    <TableCell className="text-center">{lap.startTime}</TableCell>
                    <TableCell className="text-center">{lap.duration}</TableCell>
                    <TableCell className="text-center">{lap.avgPower}W</TableCell>
                    <TableCell className="text-center">{lap.maxPower}W</TableCell>
                    <TableCell className="text-center">{lap.normalizedPower ? `${lap.normalizedPower}W` : '-'}</TableCell>
                    <TableCell className="text-center">{lap.avgCadence} RPM</TableCell>
                    <TableCell className="text-center">{lap.maxCadence} RPM</TableCell>
                    <TableCell className="text-center">{lap.avgHeartRate} BPM</TableCell>
                    <TableCell className="text-center">{lap.maxHeartRate} BPM</TableCell>
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