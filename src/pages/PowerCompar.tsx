
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { parseProperFitFile } from '@/utils/properFitParser';
import { useToast } from '@/hooks/use-toast';
import { smoothPowerData } from '@/utils/dataSmoothing';
import { generateChartData } from '@/utils/chartDataGenerator';
import FileUploadCard from '@/components/power-compar/FileUploadCard';
import PowerChart from '@/components/power-compar/PowerChart';
import RPMChart from '@/components/power-compar/RPMChart';

interface PowerData {
  time: number;
  power: number;
  rpm?: number;
}

interface FileData {
  name: string;
  avgWatts: number;
  avgRpm: number;
  powerData: PowerData[];
  duration: number; // in minutes
}

const PowerCompar = () => {
  const [file1, setFile1] = useState<FileData | null>(null);
  const [file2, setFile2] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      console.log(`Parsing FIT file with proper parser: ${file.name}`);
      const parsedData = await parseProperFitFile(file);
      console.log(`Parsed ${parsedData.records.length} records from ${file.name}`);
      
      // Extract records from nested structure similar to other pages
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
      
      // Use extracted records if available, otherwise fallback to parsed records
      const recordsToUse = trainingRecords.length > 0 ? trainingRecords : parsedData.records;
      
      // Convert parsed data to PowerData format
      const powerData: PowerData[] = [];
      
      // Get the first timestamp to calculate relative time
      const firstRecord = recordsToUse[0];
      const firstTimestamp = firstRecord?.timestamp ? new Date(firstRecord.timestamp).getTime() : 0;
      
      recordsToUse.forEach((record, index) => {
        if (record.power !== undefined && record.power > 0) {
          // Calculate time in minutes from start of workout
          let relativeTime = index / 60; // fallback to index-based time
          
          if (record.timestamp) {
            const recordTime = new Date(record.timestamp).getTime();
            relativeTime = (recordTime - firstTimestamp) / (1000 * 60); // Convert to minutes
          }
          
          powerData.push({
            time: relativeTime,
            power: record.power,
            rpm: record.cadence || undefined
          });
        }
      });
      
      if (powerData.length === 0) {
        throw new Error('No valid power data found in FIT file');
      }
      
      console.log('Power data sample:', powerData.slice(0, 5));
      
      // Apply 3-second smoothing
      const smoothedData = smoothPowerData(powerData, 3);

      // Calculate averages from smoothed data
      const validPowerData = smoothedData.filter(point => point.power > 0);
      const avgWatts = Math.round(
        validPowerData.reduce((sum, point) => sum + point.power, 0) / validPowerData.length
      );

      const validRpmData = smoothedData.filter(point => point.rpm && point.rpm > 0);
      const avgRpm = validRpmData.length > 0 ? Math.round(
        validRpmData.reduce((sum, point) => sum + (point.rpm || 0), 0) / validRpmData.length
      ) : 0;

      const fileData: FileData = {
        name: file.name,
        avgWatts,
        avgRpm,
        powerData: smoothedData,
        duration: parsedData.duration / 60 // Convert to minutes
      };

      console.log('File data processed with proper parser:', {
        name: fileData.name,
        avgWatts: fileData.avgWatts,
        avgRpm: fileData.avgRpm,
        dataPoints: fileData.powerData.length,
        duration: fileData.duration
      });

      if (fileNumber === 1) {
        setFile1(fileData);
      } else {
        setFile2(fileData);
      }
      
      toast({
        title: "Fichier chargé avec le parser FIT",
        description: `${file.name} analysé avec ${smoothedData.length} points de données`,
      });
      
    } catch (error) {
      console.error('Error parsing FIT file with proper parser:', error);
      toast({
        title: "Erreur lors du chargement",
        description: `Impossible de lire le fichier ${file.name}. ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePercentageDifference = (): number | null => {
    if (!file1 || !file2) return null;
    
    const difference = ((file2.avgWatts - file1.avgWatts) / file1.avgWatts) * 100;
    return Math.round(difference * 10) / 10; // Round to 1 decimal place
  };

  const percentageDiff = calculatePercentageDifference();
  const chartData = generateChartData(file1?.powerData || null, file2?.powerData || null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Power Compar (Proper Parser)</h1>
        <p className="text-muted-foreground">Analysez et comparez les données de puissance avec un parser FIT professionnel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadCard
          title="Fichier 1"
          description="Téléchargez votre premier fichier FIT"
          fileData={file1}
          onFileUpload={(e) => handleFileUpload(e, 1)}
          isLoading={isLoading}
          percentageDiff={percentageDiff}
          cardColor="bg-green-50"
        />

        <FileUploadCard
          title="Fichier 2"
          description="Téléchargez votre second fichier FIT"
          fileData={file2}
          onFileUpload={(e) => handleFileUpload(e, 2)}
          isLoading={isLoading}
          percentageDiff={percentageDiff}
          cardColor="bg-blue-50"
        />
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Analyse du fichier FIT avec le parser professionnel...</p>
          </CardContent>
        </Card>
      )}

      {file1 && file2 && (
        <>
          <PowerChart
            chartData={chartData}
            file1Name={file1.name}
            file2Name={file2.name}
          />
          
          <RPMChart
            chartData={chartData}
            file1Name={file1.name}
            file2Name={file2.name}
          />
        </>
      )}
    </div>
  );
};

export default PowerCompar;
