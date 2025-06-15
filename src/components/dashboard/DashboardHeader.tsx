
import React from 'react';

interface DashboardHeaderProps {
  athleteName: string;
  athleteId: string;
}

const DashboardHeader = ({ athleteName, athleteId }: DashboardHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de Bord Intervals.icu</h1>
      <p className="text-gray-600">
        Suivi des métriques de {athleteName} {athleteId && `(${athleteId})`}
      </p>
    </div>
  );
};

export default DashboardHeader;
