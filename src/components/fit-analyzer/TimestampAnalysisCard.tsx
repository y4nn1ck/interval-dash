
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimestampAnalysisCardProps {
  firstTimestamp: number;
  lastTimestamp: number;
  firstTimestampDate: string;
  lastTimestampDate: string;
}

const TimestampAnalysisCard: React.FC<TimestampAnalysisCardProps> = ({
  firstTimestamp,
  lastTimestamp,
  firstTimestampDate,
  lastTimestampDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse des timestamps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Premier timestamp (Unix):</strong> {firstTimestamp}</p>
        <p><strong>Premier timestamp (date):</strong> {firstTimestampDate}</p>
        <p><strong>Dernier timestamp (Unix):</strong> {lastTimestamp}</p>
        <p><strong>Dernier timestamp (date):</strong> {lastTimestampDate}</p>
      </CardContent>
    </Card>
  );
};

export default TimestampAnalysisCard;
