
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface FileData {
  name: string;
  avgWatts: number;
  avgRpm: number;
  duration: number; // in minutes
}

interface FileUploadCardProps {
  title: string;
  description: string;
  fileData: FileData | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  percentageDiff?: number | null;
  cardColor: string;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  title,
  description,
  fileData,
  onFileUpload,
  isLoading,
  percentageDiff,
  cardColor
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".fit"
            onChange={onFileUpload}
            className="flex-1"
            disabled={isLoading}
          />
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        {fileData && (
          <div className={`p-4 ${cardColor} rounded-lg`}>
            <p className="font-semibold">{fileData.name}</p>
            <p className="text-lg">Puissance Moyenne: <span className="font-bold">{fileData.avgWatts}W</span></p>
            <p className="text-sm text-muted-foreground">RPM Moyen: {fileData.avgRpm}</p>
            <p className="text-sm text-muted-foreground">Durée: {Math.round(fileData.duration)}min</p>
            {percentageDiff !== null && percentageDiff !== undefined && (
              <p className="text-sm text-muted-foreground">
                Différence: {percentageDiff > 0 ? '+' : ''}{percentageDiff}%
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadCard;
