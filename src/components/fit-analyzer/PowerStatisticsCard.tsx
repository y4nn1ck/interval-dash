
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PowerStatisticsCardProps {
  avgPower: number;
  maxPower: number;
  minPower: number;
  avgCadence: number;
}

const PowerStatisticsCard: React.FC<PowerStatisticsCardProps> = ({
  avgPower,
  maxPower,
  minPower,
  avgCadence
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques de puissance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Puissance moyenne:</strong> {avgPower}W</p>
        <p><strong>Puissance maximale:</strong> {maxPower}W</p>
        <p><strong>Puissance minimale:</strong> {minPower}W</p>
        <p><strong>Cadence moyenne:</strong> {avgCadence} RPM</p>
      </CardContent>
    </Card>
  );
};

export default PowerStatisticsCard;
