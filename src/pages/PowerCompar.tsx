
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Upload } from 'lucide-react';

interface PowerData {
  time: number;
  power: number;
}

interface FileData {
  name: string;
  avgNormalizedPower: number;
  powerData: PowerData[];
}

const PowerCompar = () => {
  const [file1, setFile1] = useState<FileData | null>(null);
  const [file2, setFile2] = useState<FileData | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate FIT file parsing (in real implementation, you'd use a FIT file parser)
    const mockPowerData: PowerData[] = [];
    const dataPoints = 1000 + Math.random() * 2000; // Random number of data points
    
    for (let i = 0; i < dataPoints; i++) {
      mockPowerData.push({
        time: i,
        power: Math.max(0, 200 + Math.sin(i / 100) * 50 + (Math.random() - 0.5) * 100)
      });
    }

    const avgNormalizedPower = Math.round(
      mockPowerData.reduce((sum, point) => sum + point.power, 0) / mockPowerData.length
    );

    const fileData: FileData = {
      name: file.name,
      avgNormalizedPower,
      powerData: mockPowerData
    };

    if (fileNumber === 1) {
      setFile1(fileData);
    } else {
      setFile2(fileData);
    }
  };

  const generateChartData = () => {
    if (!file1 || !file2) return [];

    const maxLength = Math.max(file1.powerData.length, file2.powerData.length);
    const chartData = [];

    for (let i = 0; i < maxLength; i++) {
      chartData.push({
        time: i,
        power1: file1.powerData[i]?.power || null,
        power2: file2.powerData[i]?.power || null,
      });
    }

    return chartData;
  };

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
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {file1 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold">{file1.name}</p>
                <p className="text-lg">NP Moyen: <span className="font-bold">{file1.avgNormalizedPower}W</span></p>
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
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {file2 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold">{file2.name}</p>
                <p className="text-lg">NP Moyen: <span className="font-bold">{file2.avgNormalizedPower}W</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Power Comparison Chart */}
      {file1 && file2 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparaison des données de puissance</CardTitle>
            <CardDescription>Évolution de la puissance dans le temps pour les deux fichiers</CardDescription>
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
                  />
                  <YAxis 
                    className="text-gray-600"
                    fontSize={12}
                    label={{ value: 'Puissance (W)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      value ? `${value}W` : 'N/A', 
                      name === 'power1' ? file1.name : file2.name
                    ]}
                    labelFormatter={(time) => `Temps: ${time}s`}
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
    </div>
  );
};

export default PowerCompar;
