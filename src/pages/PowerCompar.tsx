
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseProperFitFile } from '@/utils/properFitParser';
import { useToast } from '@/hooks/use-toast';
import { smoothPowerData } from '@/utils/dataSmoothing';
import { generateChartData } from '@/utils/chartDataGenerator';
import PowerChart from '@/components/power-compar/PowerChart';
import RPMChart from '@/components/power-compar/RPMChart';
import { Upload, X, FileText } from 'lucide-react';

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

  const handleMultipleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 2) {
      toast({
        title: "Trop de fichiers",
        description: "Veuillez sélectionner maximum 2 fichiers FIT",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const filePromises = Array.from(files).map(async (file, index) => {
        console.log(`Parsing FIT file with proper parser: ${file.name}`);
        const parsedData = await parseProperFitFile(file);
        console.log(`Parsed ${parsedData.records.length} records from ${file.name}`);
        
        // Extract records from nested structure
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
        
        recordsToUse.forEach((record, recordIndex) => {
          if (record.power !== undefined && record.power > 0) {
            // Calculate time in minutes from start of workout
            let relativeTime = recordIndex / 60; // fallback to index-based time
            
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
          throw new Error(`No valid power data found in ${file.name}`);
        }
        
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

        // Calculate actual duration from data
        const actualDuration = powerData.length > 0 ? Math.max(...powerData.map(p => p.time)) : 0;

        return {
          name: file.name,
          avgWatts,
          avgRpm,
          powerData: smoothedData,
          duration: actualDuration // Use calculated duration instead of parser duration
        };
      });

      const results = await Promise.all(filePromises);
      
      // Assign files to file1 and file2
      if (results[0]) setFile1(results[0]);
      if (results[1]) setFile2(results[1]);
      
      toast({
        title: "Fichiers chargés avec succès",
        description: `${results.length} fichier(s) analysé(s) avec le parser FIT`,
      });
      
    } catch (error) {
      console.error('Error parsing FIT files:', error);
      toast({
        title: "Erreur lors du chargement",
        description: `Impossible de lire les fichiers. ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (fileNumber: 1 | 2) => {
    if (fileNumber === 1) {
      setFile1(null);
    } else {
      setFile2(null);
    }
  };

  const calculatePercentageDifference = (): number | null => {
    if (!file1 || !file2) return null;
    
    const difference = ((file2.avgWatts - file1.avgWatts) / file1.avgWatts) * 100;
    return Math.round(difference * 10) / 10; // Round to 1 decimal place
  };

  const calculateWattsDifference = (): number | null => {
    if (!file1 || !file2) return null;
    return file2.avgWatts - file1.avgWatts;
  };

  const percentageDiff = calculatePercentageDifference();
  const wattsDiff = calculateWattsDifference();
  const chartData = generateChartData(file1?.powerData || null, file2?.powerData || null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Power Compar (Proper Parser)</h1>
        <p className="text-muted-foreground">Analysez et comparez les données de puissance avec un parser FIT professionnel</p>
      </div>

      {/* Single File Upload Section */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            Télécharger les fichiers FIT
          </CardTitle>
          <CardDescription>Sélectionnez 1 ou 2 fichiers FIT à comparer (maximum 2 fichiers)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".fit"
              multiple
              onChange={handleMultipleFileUpload}
              className="flex-1"
              disabled={isLoading}
            />
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {/* File Status Display */}
          {(file1 || file2) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* File 1 */}
              <div className={`p-4 rounded-lg border-2 ${file1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Fichier 1</h3>
                  {file1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(1)}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                </div>
                {file1 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium truncate">{file1.name}</p>
                    </div>
                    <p className="text-xs text-gray-600">Durée: {Math.round(file1.duration)}min</p>
                    <p className="text-lg font-bold text-green-700">Puissance: {file1.avgWatts}W</p>
                    <p className="text-xs text-gray-600">Cadence: {file1.avgRpm} RPM</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun fichier sélectionné</p>
                )}
              </div>

              {/* File 2 */}
              <div className={`p-4 rounded-lg border-2 ${file2 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Fichier 2</h3>
                  {file2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(2)}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                </div>
                {file2 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium truncate">{file2.name}</p>
                    </div>
                    <p className="text-xs text-gray-600">Durée: {Math.round(file2.duration)}min</p>
                    <p className="text-lg font-bold text-blue-700">Puissance: {file2.avgWatts}W</p>
                    <p className="text-xs text-gray-600">Cadence: {file2.avgRpm} RPM</p>
                    {percentageDiff !== null && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-700">
                          Différence: {percentageDiff > 0 ? '+' : ''}{percentageDiff}%
                        </p>
                        <p className="text-xs font-medium text-blue-700">
                          Soit: {wattsDiff && wattsDiff > 0 ? '+' : ''}{wattsDiff}W
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun fichier sélectionné</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p>Analyse des fichiers FIT avec le parser professionnel...</p>
            </div>
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
