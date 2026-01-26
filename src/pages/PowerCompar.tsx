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
import { Upload, X, FileText, Zap, RotateCcw, Clock } from 'lucide-react';

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
  duration: number;
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
      const filePromises = Array.from(files).map(async (file) => {
        console.log(`Parsing FIT file with proper parser: ${file.name}`);
        const parsedData = await parseProperFitFile(file);
        console.log(`Parsed ${parsedData.records.length} records from ${file.name}`);
        
        let extractedRecords: any[] = [];
        if (parsedData.rawDataStructure?.activity?.sessions?.[0]?.laps) {
          for (const lap of parsedData.rawDataStructure.activity.sessions[0].laps) {
            if (lap.records && Array.isArray(lap.records)) {
              extractedRecords = extractedRecords.concat(lap.records);
            }
          }
        }
        
        const trainingRecords = extractedRecords.filter(record => 
          record.elapsed_time !== undefined && record.elapsed_time >= 0 && record.power && record.power > 0
        );
        
        const recordsToUse = trainingRecords.length > 0 ? trainingRecords : parsedData.records;
        
        const powerData: PowerData[] = [];
        
        const firstRecord = recordsToUse[0];
        const firstTimestamp = firstRecord?.timestamp ? new Date(firstRecord.timestamp).getTime() : 0;
        
        recordsToUse.forEach((record: any, recordIndex: number) => {
          if (record.power !== undefined && record.power > 0) {
            let relativeTime = recordIndex / 60;
            
            if (record.timestamp) {
              const recordTime = new Date(record.timestamp).getTime();
              relativeTime = (recordTime - firstTimestamp) / (1000 * 60);
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
        
        const smoothedData = smoothPowerData(powerData, 3);

        const validPowerData = smoothedData.filter(point => point.power > 0);
        const avgWatts = Math.round(
          validPowerData.reduce((sum, point) => sum + point.power, 0) / validPowerData.length
        );

        const validRpmData = smoothedData.filter(point => point.rpm && point.rpm > 0);
        const avgRpm = validRpmData.length > 0 ? Math.round(
          validRpmData.reduce((sum, point) => sum + (point.rpm || 0), 0) / validRpmData.length
        ) : 0;

        const actualDuration = powerData.length > 0 ? Math.max(...powerData.map(p => p.time)) : 0;

        return {
          name: file.name,
          avgWatts,
          avgRpm,
          powerData: smoothedData,
          duration: actualDuration
        };
      });

      const results = await Promise.all(filePromises);
      
      if (results[0]) setFile1(results[0]);
      if (results[1]) setFile2(results[1]);
      
      toast({
        title: "Fichiers chargés avec succès",
        description: `${results.length} fichier(s) analysé(s)`,
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
    return Math.round(difference * 10) / 10;
  };

  const calculateWattsDifference = (): number | null => {
    if (!file1 || !file2) return null;
    return file2.avgWatts - file1.avgWatts;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
    return `${mins}min`;
  };

  const percentageDiff = calculatePercentageDifference();
  const wattsDiff = calculateWattsDifference();
  const chartData = generateChartData(file1?.powerData || null, file2?.powerData || null);

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 opacity-0 animate-fade-in-up">
        <h1 className="text-4xl font-bold gradient-text">Power Compar</h1>
        <p className="text-muted-foreground text-lg">Analysez et comparez les données de puissance de vos entraînements</p>
      </div>

      {/* File Upload Section */}
      <Card className="glass-card glow border-primary/20 opacity-0 animate-fade-in-up-delay-1">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/20">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            Télécharger les fichiers FIT
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sélectionnez 1 ou 2 fichiers FIT à comparer (maximum 2 fichiers)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".fit"
              multiple
              onChange={handleMultipleFileUpload}
              className="flex-1 bg-secondary/50 border-border/50 file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:cursor-pointer hover:file:bg-primary/80 transition-all"
              disabled={isLoading}
            />
          </div>
          
          {/* File Status Display */}
          {(file1 || file2) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File 1 */}
              <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${file1 ? 'metric-card border-emerald-500/30' : 'bg-secondary/30 border-border/30 border-dashed'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${file1 ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                    <h3 className="font-semibold text-sm text-foreground">Fichier 1</h3>
                  </div>
                  {file1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(1)}
                      className="h-7 w-7 p-0 hover:bg-destructive/20"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                {file1 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      <p className="text-sm font-medium truncate text-foreground">{file1.name}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-cyan-400" />
                        <p className="text-xs text-muted-foreground">Durée</p>
                        <p className="text-sm font-bold text-foreground">{formatDuration(file1.duration)}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <Zap className="h-4 w-4 mx-auto mb-1 text-orange-400" />
                        <p className="text-xs text-muted-foreground">Puissance</p>
                        <p className="text-sm font-bold text-orange-400">{file1.avgWatts}W</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <RotateCcw className="h-4 w-4 mx-auto mb-1 text-purple-400" />
                        <p className="text-xs text-muted-foreground">Cadence</p>
                        <p className="text-sm font-bold text-purple-400">{file1.avgRpm}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun fichier sélectionné</p>
                )}
              </div>

              {/* File 2 */}
              <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${file2 ? 'metric-card border-cyan-500/30' : 'bg-secondary/30 border-border/30 border-dashed'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${file2 ? 'bg-cyan-500' : 'bg-muted'}`}></div>
                    <h3 className="font-semibold text-sm text-foreground">Fichier 2</h3>
                  </div>
                  {file2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(2)}
                      className="h-7 w-7 p-0 hover:bg-destructive/20"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                {file2 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <p className="text-sm font-medium truncate text-foreground">{file2.name}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-cyan-400" />
                        <p className="text-xs text-muted-foreground">Durée</p>
                        <p className="text-sm font-bold text-foreground">{formatDuration(file2.duration)}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <Zap className="h-4 w-4 mx-auto mb-1 text-orange-400" />
                        <p className="text-xs text-muted-foreground">Puissance</p>
                        <p className="text-sm font-bold text-orange-400">{file2.avgWatts}W</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <RotateCcw className="h-4 w-4 mx-auto mb-1 text-purple-400" />
                        <p className="text-xs text-muted-foreground">Cadence</p>
                        <p className="text-sm font-bold text-purple-400">{file2.avgRpm}</p>
                      </div>
                    </div>
                    {percentageDiff !== null && (
                      <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/30">
                        <div className={`px-3 py-1.5 rounded-lg ${percentageDiff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'}`}>
                          <span className="text-sm font-bold">{percentageDiff > 0 ? '+' : ''}{percentageDiff}%</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg ${(wattsDiff || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'}`}>
                          <span className="text-sm font-bold">{wattsDiff && wattsDiff > 0 ? '+' : ''}{wattsDiff}W</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun fichier sélectionné</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              </div>
              <p className="text-muted-foreground">Analyse des fichiers FIT en cours...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {file1 && file2 && (
        <>
          <div className="opacity-0 animate-fade-in-up-delay-2">
            <PowerChart
              chartData={chartData}
              file1Name={file1.name}
              file2Name={file2.name}
            />
          </div>
          
          <div className="opacity-0 animate-fade-in-up-delay-3">
            <RPMChart
              chartData={chartData}
              file1Name={file1.name}
              file2Name={file2.name}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PowerCompar;
