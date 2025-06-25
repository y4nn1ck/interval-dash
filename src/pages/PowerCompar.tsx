import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Upload } from 'lucide-react';
import { parseFitFile } from '@/utils/fitFileParser';
import { useToast } from '@/hooks/use-toast';

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

  const smoothPowerData = (data: PowerData[], windowSize: number = 3): PowerData[] => {
    return data.map((point, index) => {
      const start = Math.max(0, index - Math.floor(windowSize / 2));
      const end = Math.min(data.length, index + Math.ceil(windowSize / 2));
      const slice = data.slice(start, end);
      const avgPower = slice.reduce((sum, p) => sum + p.power, 0) / slice.length;
      const avgRpm = slice.reduce((sum, p) => sum + (p.rpm || 0), 0) / slice.length;
      
      return {
        time: point.time,
        power: avgPower,
        rpm: avgRpm
      };
    });
  };

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

  const generateChartData = () => {
    if (!file1 || !file2) return [];

    const maxLength = Math.max(file1.powerData.length, file2.powerData.length);
    const chartData = [];

    for (let i = 0; i < maxLength; i++) {
      chartData.push({
        time: i / 60, // Already in minutes from data processing
        power1: file1.powerData[i]?.power || null,
        power2: file2.powerData[i]?.power || null,
        rpm1: file1.powerData[i]?.rpm || null,
        rpm2: file2.powerData[i]?.rpm || null,
      });
    }

    return chartData;
  };

  const percentageDiff = calculatePercentageDifference();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Power Compar</h1>
        <p className="text-muted-foreground">Analysez et comparez les données de puissance de deux fichiers FIT</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File 1 Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Fichier 1</CardTitle>
            <CardDescription>Téléchargez votre premier fichier FIT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".fit"
                onChange={(e) => handleFileUpload(e, 1)}
                className="flex-1"
                disabled={isLoading}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {file1 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold">{file1.name}</p>
                <p className="text-lg">Puissance Moyenne: <span className="font-bold">{file1.avgWatts}W</span></p>
                <p className="text-sm text-muted-foreground">RPM Moyen: {file1.avgRpm}</p>
                <p className="text-sm text-muted-foreground">Durée: {Math.round(file1.duration)}min</p>
                {percentageDiff !== null && (
                  <p className="text-sm text-muted-foreground">
                    Différence: {percentageDiff > 0 ? '+' : ''}{percentageDiff}%
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File 2 Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Fichier 2</CardTitle>
            <CardDescription>Téléchargez votre second fichier FIT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".fit"
                onChange={(e) => handleFileUpload(e, 2)}
                className="flex-1"
                disabled={isLoading}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {file2 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold">{file2.name}</p>
                <p className="text-lg">Puissance Moyenne: <span className="font-bold">{file2.avgWatts}W</span></p>
                <p className="text-sm text-muted-foreground">RPM Moyen: {file2.avgRpm}</p>
                <p className="text-sm text-muted-foreground">Durée: {Math.round(file2.duration)}min</p>
                {percentageDiff !== null && (
                  <p className="text-sm text-muted-foreground">
                    Différence: {percentageDiff > 0 ? '+' : ''}{percentageDiff}%
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Analyse du fichier FIT en cours...</p>
          </CardContent>
        </Card>
      )}

      {/* Power Comparison Chart */}
      {file1 && file2 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparaison des données de puissance</CardTitle>
            <CardDescription>Évolution de la puissance dans le temps pour les deux fichiers (lissage 3 secondes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    className="text-gray-600"
                    fontSize={12}
                    tickFormatter={(value) => `${Math.round(value)}min`}
                  />
                  <YAxis 
                    className="text-gray-600"
                    fontSize={12}
                    label={{ value: 'Puissance (W)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      value ? `${Math.round(Number(value))}W` : 'N/A', 
                      name === 'power1' ? file1.name : file2.name
                    ]}
                    labelFormatter={(time) => `Temps: ${Math.round(Number(time))}min`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="power1" 
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name={file1.name}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="power2" 
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name={file2.name}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RPM Comparison Chart */}
      {file1 && file2 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparaison des données RPM</CardTitle>
            <CardDescription>Évolution de la cadence dans le temps pour les deux fichiers (lissage 3 secondes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    className="text-gray-600"
                    fontSize={12}
                    tickFormatter={(value) => `${Math.round(value)}min`}
                  />
                  <YAxis 
                    className="text-gray-600"
                    fontSize={12}
                    label={{ value: 'RPM', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      value ? `${Math.round(Number(value))} RPM` : 'N/A', 
                      name === 'rpm1' ? file1.name : file2.name
                    ]}
                    labelFormatter={(time) => `Temps: ${Math.round(Number(time))}min`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rpm1" 
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name={file1.name}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rpm2" 
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name={file2.name}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PowerCompar;
