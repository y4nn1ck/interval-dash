
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { parseFitFile } from '@/utils/fitFileParser';
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

  // Convert Unix timestamp to JavaScript Date
  // FIT timestamps are already in Unix format (seconds since Jan 1, 1970)
  const unixToJsDate = (unixTimestamp: number): Date => {
    return new Date(unixTimestamp * 1000);
  };

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

      // Get first and last timestamps (these are already Unix timestamps)
      const firstRecord = validRecords[0];
      const lastRecord = validRecords[validRecords.length - 1];
      
      const firstTimestamp = firstRecord.timestamp || 0;
      const lastTimestamp = lastRecord.timestamp || 0;
      
      // Calculate duration in seconds
      const calculatedDuration = lastTimestamp - firstTimestamp;
      const rawDuration = parsedData.duration;
      
      // Convert timestamps to dates
      const firstDate = unixToJsDate(firstTimestamp);
      const lastDate = unixToJsDate(lastTimestamp);
      
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
        timestampDate: unixToJsDate(record.timestamp || 0).toISOString(),
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

      <Card>
        <CardHeader>
          <CardTitle>Télécharger un fichier FIT</CardTitle>
          <CardDescription>Sélectionnez un fichier FIT pour une analyse détaillée</CardDescription>
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
            <p>Analyse du fichier FIT en cours...</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du fichier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Nom:</strong> {analysis.fileName}</p>
              <p><strong>Nombre d'enregistrements:</strong> {analysis.recordCount}</p>
            </CardContent>
          </Card>

          {/* Duration Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse de la durée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Durée brute (parser):</strong> {analysis.rawDuration} secondes ({Math.round(analysis.rawDuration / 60)} minutes)</p>
              <p><strong>Durée calculée (dernier - premier timestamp):</strong> {analysis.calculatedDuration} secondes ({Math.round(analysis.calculatedDuration / 60)} minutes)</p>
            </CardContent>
          </Card>

          {/* Timestamp Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse des timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Premier timestamp (Unix):</strong> {analysis.firstTimestamp}</p>
              <p><strong>Premier timestamp (date):</strong> {analysis.firstTimestampDate}</p>
              <p><strong>Dernier timestamp (Unix):</strong> {analysis.lastTimestamp}</p>
              <p><strong>Dernier timestamp (date):</strong> {analysis.lastTimestampDate}</p>
            </CardContent>
          </Card>

          {/* Power Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de puissance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Puissance moyenne:</strong> {analysis.avgPower}W</p>
              <p><strong>Puissance maximale:</strong> {analysis.maxPower}W</p>
              <p><strong>Puissance minimale:</strong> {analysis.minPower}W</p>
              <p><strong>Cadence moyenne:</strong> {analysis.avgCadence} RPM</p>
            </CardContent>
          </Card>

          {/* Sample Data */}
          <Card>
            <CardHeader>
              <CardTitle>Échantillon de données (10 premiers enregistrements)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Timestamp (Unix)</th>
                      <th className="text-left p-2">Date/Heure</th>
                      <th className="text-left p-2">Puissance (W)</th>
                      <th className="text-left p-2">Cadence (RPM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.sampleRecords.map((record, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{record.timestamp}</td>
                        <td className="p-2">{new Date(record.timestampDate).toLocaleString()}</td>
                        <td className="p-2">{record.power}</td>
                        <td className="p-2">{record.cadence || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FitAnalyzer;
