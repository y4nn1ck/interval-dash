
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SampleRecord {
  timestamp: number;
  timestampDate: string;
  power: number;
  cadence?: number;
}

interface SampleDataTableProps {
  sampleRecords: SampleRecord[];
}

const SampleDataTable: React.FC<SampleDataTableProps> = ({ sampleRecords }) => {
  return (
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
              {sampleRecords.map((record, index) => (
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
  );
};

export default SampleDataTable;
