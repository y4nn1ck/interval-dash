
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFitAnalysisProcessor, FitAnalysis } from '@/components/fit-analyzer/FitAnalysisProcessor';
import FileUploadSection from '@/components/fit-analyzer/FileUploadSection';
import FitAnalysisResults from '@/components/fit-analyzer/FitAnalysisResults';

const FitAnalyzer = () => {
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(null);
  
  const { handleFileUpload, isLoading } = useFitAnalysisProcessor({
    onAnalysisComplete: setAnalysis
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">FIT Analyzer (Proper Parser)</h1>
        <p className="text-muted-foreground">Analysez en détail un fichier FIT avec un parser FIT professionnel</p>
      </div>

      <FileUploadSection onFileUpload={handleFileUpload} isLoading={isLoading} />

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Analyse du fichier FIT avec le parser professionnel...</p>
          </CardContent>
        </Card>
      )}

      {analysis && <FitAnalysisResults analysis={analysis} />}
    </div>
  );
};

export default FitAnalyzer;
