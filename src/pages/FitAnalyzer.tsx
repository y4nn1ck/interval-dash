
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { parseProperFitFile } from '@/utils/properFitParser';
import { useToast } from '@/hooks/use-toast';
import { Upload, Calendar, Clock, Zap, RotateCcw, Heart } from 'lucide-react';
import FitDataChart from '@/components/fit-analyzer/FitDataChart';
import { format } from 'date-fns';

interface FitRecord {
  timestamp?: number;
  power?: number;
  cadence?: number;
  heart_rate?: number;
  elapsed_time?: number;
}

interface FitFileInfo {
  fileName: string;
  startDate: string;
  startTime: string;
  duration: number; // in minutes
  avgPower: number;
  maxPower: number;
  avgCadence: number;
  maxCadence: number;
  avgHeartRate: number;
  maxHeartRate: number;
  recordCount: number;
}

interface ChartDataPoint {
  time: number;
  power: number | null;
  cadence: number | null;
  heart_rate: number | null;
}

const FitAnalyzer = () => {
  const [fileInfo, setFileInfo] = useState<FitFileInfo | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

      // Create file info
      const info: FitFileInfo = {
        fileName: file.name,
        startDate,
        startTime,
        duration: calculatedDuration,
        avgPower,
        maxPower,
        avgCadence,
        maxCadence,
        avgHeartRate,
        maxHeartRate,
        recordCount: recordsToUse.length
      };

      setFileInfo(info);

      // Prepare chart data
      const chartPoints: ChartDataPoint[] = [];
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
      });

      setChartData(chartPoints);
      
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    }
    return `${remainingMinutes}min`;
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
            <CardDescription>{fileInfo.fileName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Date & Time */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Date & Heure</p>
                  <p className="text-sm font-bold text-blue-700">{fileInfo.startDate}</p>
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
                  <p className="text-sm font-bold text-green-700">{formatDuration(fileInfo.duration)}</p>
                </div>
              </div>

              {/* Power */}
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Puissance</p>
                  <p className="text-sm font-bold text-orange-700">Moy: {fileInfo.avgPower}W</p>
                  <p className="text-xs text-orange-600">Max: {fileInfo.maxPower}W</p>
                </div>
              </div>

              {/* Cadence */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Cadence</p>
                  <p className="text-sm font-bold text-purple-700">Moy: {fileInfo.avgCadence} RPM</p>
                  <p className="text-xs text-purple-600">Max: {fileInfo.maxCadence} RPM</p>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Fréquence Cardiaque</p>
                  <p className="text-sm font-bold text-red-700">Moy: {fileInfo.avgHeartRate} BPM</p>
                  <p className="text-xs text-red-600">Max: {fileInfo.maxHeartRate} BPM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Chart */}
      {chartData.length > 0 && (
        <FitDataChart data={chartData} />
      )}
    </div>
  );
};

export default FitAnalyzer;
