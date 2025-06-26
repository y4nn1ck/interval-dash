
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface FileUploadSectionProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ onFileUpload, isLoading }) => {
  return (
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
            onChange={onFileUpload}
            className="flex-1"
            disabled={isLoading}
          />
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
