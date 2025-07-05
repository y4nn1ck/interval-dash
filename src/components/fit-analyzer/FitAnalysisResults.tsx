
import React from 'react';
import { FitAnalysis } from './FitAnalysisProcessor';
import FileInfoCard from './FileInfoCard';
import AdditionalInfoCard from './AdditionalInfoCard';
import DurationAnalysisCard from './DurationAnalysisCard';
import TimestampAnalysisCard from './TimestampAnalysisCard';
import PowerStatisticsCard from './PowerStatisticsCard';
import SampleDataTable from './SampleDataTable';

interface FitAnalysisResultsProps {
  analysis: FitAnalysis;
}

const FitAnalysisResults: React.FC<FitAnalysisResultsProps> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      <FileInfoCard fileName={analysis.fileName} recordCount={analysis.recordCount} />
      
      <AdditionalInfoCard
        sessionCount={analysis.sessionCount}
        lapCount={analysis.lapCount}
        avgHeartRate={analysis.avgHeartRate}
        deviceInfo={analysis.deviceInfo}
      />
      
      <DurationAnalysisCard 
        rawDuration={analysis.rawDuration} 
        calculatedDuration={analysis.calculatedDuration} 
      />
      
      <TimestampAnalysisCard
        firstTimestamp={analysis.firstTimestamp}
        lastTimestamp={analysis.lastTimestamp}
        firstTimestampDate={analysis.firstTimestampDate}
        lastTimestampDate={analysis.lastTimestampDate}
      />
      
      <PowerStatisticsCard
        avgPower={analysis.avgPower}
        maxPower={analysis.maxPower}
        minPower={analysis.minPower}
        avgCadence={analysis.avgCadence}
      />
      
      <SampleDataTable sampleRecords={analysis.sampleRecords} />
    </div>
  );
};

export default FitAnalysisResults;
