
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileInfoCardProps {
  fileName: string;
  recordCount: number;
}

const FileInfoCard: React.FC<FileInfoCardProps> = ({ fileName, recordCount }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations du fichier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Nom:</strong> {fileName}</p>
        <p><strong>Nombre d'enregistrements:</strong> {recordCount}</p>
      </CardContent>
    </Card>
  );
};

export default FileInfoCard;
