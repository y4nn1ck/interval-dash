
import { useState } from 'react';
import { parseProperFitFile } from '@/utils/properFitParser';
import { useToast } from '@/hooks/use-toast';

interface FitAnalysis {
  fileName: string;
  recordCount: number;
  rawDuration: number;
  calculatedDuration: number;
  firstTimestamp: number;
  lastTimestamp: number;
  firstTimestampDate: string;
  lastTimestampDate: string;
  avgPower: number;
  maxPower: number;
  minPower: number;
  avgCadence: number;
  avgHeartRate: number;
  deviceInfo?: any;
  sessionCount: number;
  lapCount: number;
  sampleRecords: Array<{
    timestamp: number;
    timestampDate: string;
    power: number;
    cadence?: number;
    heart_rate?: number;
    speed?: number;
  }>;
}

interface FitAnalysisProcessorProps {
  onAnalysisComplete: (analysis: FitAnalysis) => void;
}

export const useFitAnalysisProcessor = ({ onAnalysisComplete }: FitAnalysisProcessorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Handle nested timestamp structure (like timestamp.value.iso)
    if (timestamp && typeof timestamp === 'object') {
      if (timestamp.value && timestamp.value.iso) {
        try {
          const date = new Date(timestamp.value.iso);
          if (!isNaN(date.getTime())) {
            return date.toISOString().replace('T', ' ').substring(0, 19);
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
          return date.toISOString().replace('T', ' ').substring(0, 19);
        }
      } catch (e) {
        console.log('Error parsing string timestamp:', e);
      }
    }
    
    // Handle direct Date object
    if (timestamp instanceof Date) {
      if (!isNaN(timestamp.getTime())) {
        return timestamp.toISOString().replace('T', ' ').substring(0, 19);
      }
    }
    
    // Handle direct number (Unix timestamp)
    if (typeof timestamp === 'number') {
      try {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toISOString().replace('T', ' ').substring(0, 19);
        }
      } catch (e) {
        console.log('Error parsing number timestamp:', e);
      }
    }
    
    return 'N/A';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      console.log(`Analyzing FIT file with proper parser: ${file.name}`);
      const parsedData = await parseProperFitFile(file);
      
      // Extract records from nested structure similar to FitRawReader
      let extractedRecords = [];
      if (parsedData.rawDataStructure?.activity?.sessions?.[0]?.laps) {
        for (const lap of parsedData.rawDataStructure.activity.sessions[0].laps) {
          if (lap.records && Array.isArray(lap.records)) {
            extractedRecords = extractedRecords.concat(lap.records);
          }
        }
      }
      
      // Filter records starting from elapsed_time: 0 (start of training)
      const trainingRecords = extractedRecords.filter(record => 
        record.elapsed_time !== undefined && record.elapsed_time >= 0 && record.power && record.power > 0
      );
      
      const validRecords = trainingRecords.length > 0 ? trainingRecords : parsedData.records.filter(r => r.power && r.power > 0);
      
      if (validRecords.length === 0) {
        throw new Error('No valid power data found');
      }

      // Get first and last timestamps with proper formatting
      const firstRecord = validRecords[0];
      const lastRecord = validRecords[validRecords.length - 1];
      
      const firstTimestamp = firstRecord.timestamp ? new Date(firstRecord.timestamp).getTime() / 1000 : 0;
      const lastTimestamp = lastRecord.timestamp ? new Date(lastRecord.timestamp).getTime() / 1000 : 0;
      
      // Calculate duration in seconds
      const calculatedDuration = lastTimestamp - firstTimestamp;
      const rawDuration = parsedData.duration;
      
      // Convert timestamps to dates with proper formatting
      const firstDate = firstRecord.timestamp ? formatTimestamp(firstRecord.timestamp) : 'N/A';
      const lastDate = lastRecord.timestamp ? formatTimestamp(lastRecord.timestamp) : 'N/A';
      
      // Calculate statistics
      const powers = validRecords.map(r => r.power!);
      const avgPower = powers.reduce((sum, p) => sum + p, 0) / powers.length;
      const maxPower = Math.max(...powers);
      const minPower = Math.min(...powers);
      
      const cadences = validRecords.filter(r => r.cadence && r.cadence > 0).map(r => r.cadence!);
      const avgCadence = cadences.length > 0 ? cadences.reduce((sum, c) => sum + c, 0) / cadences.length : 0;
      
      const heartRates = validRecords.filter(r => r.heart_rate && r.heart_rate > 0).map(r => r.heart_rate!);
      const avgHeartRate = heartRates.length > 0 ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length : 0;
      
      // Get sample records with proper timestamp formatting
      const sampleRecords = validRecords.slice(0, 10).map(record => ({
        timestamp: record.timestamp ? new Date(record.timestamp).getTime() / 1000 : 0,
        timestampDate: formatTimestamp(record.timestamp),
        power: record.power!,
        cadence: record.cadence,
        heart_rate: record.heart_rate,
        speed: record.speed
      }));

      const analysisData: FitAnalysis = {
        fileName: file.name,
        recordCount: validRecords.length,
        rawDuration,
        calculatedDuration,
        firstTimestamp,
        lastTimestamp,
        firstTimestampDate: firstDate,
        lastTimestampDate: lastDate,
        avgPower: Math.round(avgPower),
        maxPower,
        minPower,
        avgCadence: Math.round(avgCadence),
        avgHeartRate: Math.round(avgHeartRate),
        deviceInfo: parsedData.device_info,
        sessionCount: parsedData.sessions.length,
        lapCount: parsedData.laps.length,
        sampleRecords
      };

      console.log('Proper FIT Analysis complete:', analysisData);
      onAnalysisComplete(analysisData);
      
      toast({
        title: "Analyse terminée avec le parser FIT",
        description: `${file.name} analysé avec ${validRecords.length} points de données valides`,
      });
      
    } catch (error) {
      console.error('Error analyzing FIT file with proper parser:', error);
      toast({
        title: "Erreur lors de l'analyse",
        description: `Impossible d'analyser le fichier ${file.name}: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleFileUpload, isLoading };
};

export type { FitAnalysis };
