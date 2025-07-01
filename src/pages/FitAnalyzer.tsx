
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { parseProperFitFile } from '@/utils/properFitParser';
import { useToast } from '@/hooks/use-toast';
import FileUploadSection from '@/components/fit-analyzer/FileUploadSection';
import FileInfoCard from '@/components/fit-analyzer/FileInfoCard';
import DurationAnalysisCard from '@/components/fit-analyzer/DurationAnalysisCard';
import TimestampAnalysisCard from '@/components/fit-analyzer/TimestampAnalysisCard';
import PowerStatisticsCard from '@/components/fit-analyzer/PowerStatisticsCard';
import SampleDataTable from '@/components/fit-analyzer/SampleDataTable';

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

const FitAnalyzer = () => {
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      console.log(`Analyzing FIT file with proper parser: ${file.name}`);
      const parsedData = await parseProperFitFile(file);
      
      const validRecords = parsedData.records.filter(r => r.power && r.power > 0);
      
      if (validRecords.length === 0) {
        throw new Error('No valid power data found');
      }

      // Get first and last timestamps
      const firstRecord = validRecords[0];
      const lastRecord = validRecords[validRecords.length - 1];
      
      const firstTimestamp = firstRecord.timestamp ? new Date(firstRecord.timestamp).getTime() / 1000 : 0;
      const lastTimestamp = lastRecord.timestamp ? new Date(lastRecord.timestamp).getTime() / 1000 : 0;
      
      // Calculate duration in seconds
      const calculatedDuration = lastTimestamp - firstTimestamp;
      const rawDuration = parsedData.duration;
      
      // Convert timestamps to dates
      const firstDate = firstRecord.timestamp ? new Date(firstRecord.timestamp) : new Date();
      const lastDate = lastRecord.timestamp ? new Date(lastRecord.timestamp) : new Date();
      
      console.log('Proper timestamp conversion:', {
        firstTimestamp,
        lastTimestamp,
        firstDate: firstDate.toISOString(),
        lastDate: lastDate.toISOString()
      });
      
      // Calculate statistics
      const powers = validRecords.map(r => r.power!);
      const avgPower = powers.reduce((sum, p) => sum + p, 0) / powers.length;
      const maxPower = Math.max(...powers);
      const minPower = Math.min(...powers);
      
      const cadences = validRecords.filter(r => r.cadence && r.cadence > 0).map(r => r.cadence!);
      const avgCadence = cadences.length > 0 ? cadences.reduce((sum, c) => sum + c, 0) / cadences.length : 0;
      
      const heartRates = validRecords.filter(r => r.heart_rate && r.heart_rate > 0).map(r => r.heart_rate!);
      const avgHeartRate = heartRates.length > 0 ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length : 0;
      
      // Get sample records
      const sampleRecords = validRecords.slice(0, 10).map(record => ({
        timestamp: record.timestamp ? new Date(record.timestamp).getTime() / 1000 : 0,
        timestampDate: record.timestamp ? new Date(record.timestamp).toISOString() : '',
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
        firstTimestampDate: firstDate.toISOString(),
        lastTimestampDate: lastDate.toISOString(),
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
      setAnalysis(analysisData);
      
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">FIT Analyzer (Proper Parser)</h1>
        <p className="text-muted-foreground">Analysez en détail un fichier FIT avec un parser FIT professionnel</p>
      </div>

      <FileUploadSection onFileUpload={handleFileUpload} isLoading={isLoading} />

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Analyse du fichier FIT avec le parser professionnel...</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          <FileInfoCard fileName={analysis.fileName} recordCount={analysis.recordCount} />
          
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold">Informations supplémentaires</h3>
              <p><strong>Sessions:</strong> {analysis.sessionCount}</p>
              <p><strong>Laps:</strong> {analysis.lapCount}</p>
              <p><strong>Fréquence cardiaque moyenne:</strong> {analysis.avgHeartRate} bpm</p>
              {analysis.deviceInfo && (
                <div>
                  <p><strong>Informations de l'appareil:</strong></p>
                  <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(analysis.deviceInfo, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
          
          <DurationAnalysisCard 
            rawDuration={analysis.rawDuration} 
            calculatedDuration={analysis.calculatedDuration} 
          />
          
          <TimestampAnalysisCard
            firstTimestamp={analysis.firstTimestamp}
            lastTimestamp={analysis.lastTimestamp}
            firstTimestampDate={analysis.firstTimestampDate}
            lastTimestampDate={analysis.lastTimestampDate}
          />
          
          <PowerStatisticsCard
            avgPower={analysis.avgPower}
            maxPower={analysis.maxPower}
            minPower={analysis.minPower}
            avgCadence={analysis.avgCadence}
          />
          
          <SampleDataTable sampleRecords={analysis.sampleRecords} />
        </div>
      )}
    </div>
  );
};

export default FitAnalyzer;
