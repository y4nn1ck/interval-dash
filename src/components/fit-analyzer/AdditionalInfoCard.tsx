
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdditionalInfoCardProps {
  sessionCount: number;
  lapCount: number;
  avgHeartRate: number;
  deviceInfo?: any;
}

const AdditionalInfoCard: React.FC<AdditionalInfoCardProps> = ({
  sessionCount,
  lapCount,
  avgHeartRate,
  deviceInfo
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations supplémentaires</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Sessions:</strong> {sessionCount}</p>
        <p><strong>Laps:</strong> {lapCount}</p>
        <p><strong>Fréquence cardiaque moyenne:</strong> {avgHeartRate} bpm</p>
        {deviceInfo && (
          <div>
            <p><strong>Informations de l'appareil:</strong></p>
            <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(deviceInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdditionalInfoCard;
