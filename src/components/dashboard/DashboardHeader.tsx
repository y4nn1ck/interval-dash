import React from 'react';

interface DashboardHeaderProps {
  athleteName: string;
  athleteId: string;
}

const DashboardHeader = ({ athleteName, athleteId }: DashboardHeaderProps) => {
  return (
    <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
      <h1 className="text-4xl font-bold mb-2">
        <span className="gradient-text">Tableau de Bord</span>{' '}
        <span className="text-foreground">Intervals.icu</span>
      </h1>
      <p className="text-muted-foreground">
        Suivi des métriques de {athleteName} {athleteId && `(${athleteId})`}
      </p>
    </div>
  );
};

export default DashboardHeader;
