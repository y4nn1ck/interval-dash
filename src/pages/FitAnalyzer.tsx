
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { parseFitFile, fitTimestampToDate } from '@/utils/fitFileParser';
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
  sampleRecords: Array<{
    timestamp: number;
    timestampDate: string;
    power: number;
    cadence?: number;
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
      console.log(`Analyzing FIT file: ${file.name}`);
      const parsedData = await parseFitFile(file);
      
      const validRecords = parsedData.records.filter(r => r.power && r.power > 0);
      
      if (validRecords.length === 0) {
        throw new Error('No valid power data found');
      }

      // Get first and last timestamps (these are FIT timestamps)
      const firstRecord = validRecords[0];
      const lastRecord = validRecords[validRecords.length - 1];
      
      const firstTimestamp = firstRecord.timestamp || 0;
      const lastTimestamp = lastRecord.timestamp || 0;
      
      // Calculate duration in seconds
      const calculatedDuration = lastTimestamp - firstTimestamp;
      const rawDuration = parsedData.duration;
      
      // Convert FIT timestamps to dates
      const firstDate = fitTimestampToDate(firstTimestamp);
      const lastDate = fitTimestampToDate(lastTimestamp);
      
      console.log('Timestamp conversion:', {
        firstFitTimestamp: firstTimestamp,
        lastFitTimestamp: lastTimestamp,
        firstDate: firstDate.toISOString(),
        lastDate: lastDate.toISOString()
      });
      
      // Calculate power statistics
      const powers = validRecords.map(r => r.power!);
      const avgPower = powers.reduce((sum, p) => sum + p, 0) / powers.length;
      const maxPower = Math.max(...powers);
      const minPower = Math.min(...powers);
      
      // Calculate cadence average
      const cadences = validRecords.filter(r => r.cadence && r.cadence > 0).map(r => r.cadence!);
      const avgCadence = cadences.length > 0 ? cadences.reduce((sum, c) => sum + c, 0) / cadences.length : 0;
      
      // Get sample records with converted timestamps
      const sampleRecords = validRecords.slice(0, 10).map(record => ({
        timestamp: record.timestamp || 0,
        timestampDate: fitTimestampToDate(record.timestamp || 0).toISOString(),
        power: record.power!,
        cadence: record.cadence
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
        sampleRecords
      };

      console.log('FIT Analysis complete:', analysisData);
      setAnalysis(analysisData);
      
      toast({
        title: "Analyse terminée",
        description: `${file.name} analysé avec ${validRecords.length} points de données`,
      });
      
    } catch (error) {
      console.error('Error analyzing FIT file:', error);
      toast({
        title: "Erreur lors de l'analyse",
        description: `Impossible d'analyser le fichier ${file.name}`,
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
        <p className="text-muted-foreground">Analysez en détail un fichier FIT pour déboguer les données</p>
      </div>

      <FileUploadSection onFileUpload={handleFileUpload} isLoading={isLoading} />

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Analyse du fichier FIT en cours...</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          <FileInfoCard fileName={analysis.fileName} recordCount={analysis.recordCount} />
          
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
