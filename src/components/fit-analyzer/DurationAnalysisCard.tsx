
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DurationAnalysisCardProps {
  rawDuration: number;
  calculatedDuration: number;
}

const DurationAnalysisCard: React.FC<DurationAnalysisCardProps> = ({ rawDuration, calculatedDuration }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse de la durée</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Durée brute (parser):</strong> {rawDuration} secondes ({Math.round(rawDuration / 60)} minutes)</p>
        <p><strong>Durée calculée (dernier - premier timestamp):</strong> {calculatedDuration} secondes ({Math.round(calculatedDuration / 60)} minutes)</p>
      </CardContent>
    </Card>
  );
};

export default DurationAnalysisCard;
