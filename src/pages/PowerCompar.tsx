
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { parseFitFile } from '@/utils/fitFileParser';
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
      console.log(`Parsing FIT file: ${file.name}`);
      const parsedData = await parseFitFile(file);
      console.log(`Parsed ${parsedData.records.length} records from ${file.name}`);
      
      // Convert parsed data to PowerData format
      const powerData: PowerData[] = [];
      let startTime: number | null = null;
      
      parsedData.records.forEach((record, index) => {
        if (record.power !== undefined) {
          // Use index-based time if no timestamp, or calculate relative time
          let timeInMinutes: number;
          
          if (record.timestamp !== undefined) {
            if (startTime === null) {
              startTime = record.timestamp;
            }
            timeInMinutes = (record.timestamp - startTime) / 60;
          } else {
            timeInMinutes = index / 60; // Assume 1 record per second
          }
          
          powerData.push({
            time: timeInMinutes,
            power: record.power,
            rpm: record.cadence || undefined
          });
        }
      });
      
      if (powerData.length === 0) {
        throw new Error('No power data found in FIT file');
      }
      
      // Apply 3-second smoothing
      const smoothedData = smoothPowerData(powerData, 3);

      const avgWatts = Math.round(
        smoothedData.reduce((sum, point) => sum + point.power, 0) / smoothedData.length
      );

      const avgRpm = Math.round(
        smoothedData.reduce((sum, point) => sum + (point.rpm || 0), 0) / smoothedData.length
      );

      const fileData: FileData = {
        name: file.name,
        avgWatts,
        avgRpm,
        powerData: smoothedData,
        duration: parsedData.duration / 60 // Convert to minutes
      };

      if (fileNumber === 1) {
        setFile1(fileData);
      } else {
        setFile2(fileData);
      }
      
      toast({
        title: "Fichier chargé avec succès",
        description: `${file.name} analysé avec ${smoothedData.length} points de données`,
      });
      
    } catch (error) {
      console.error('Error parsing FIT file:', error);
      toast({
        title: "Erreur lors du chargement",
        description: `Impossible de lire le fichier ${file.name}. Vérifiez qu'il s'agit d'un fichier FIT valide.`,
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
        <h1 className="text-3xl font-bold">Power Compar</h1>
        <p className="text-muted-foreground">Analysez et comparez les données de puissance de deux fichiers FIT</p>
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
            <p>Analyse du fichier FIT en cours...</p>
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
