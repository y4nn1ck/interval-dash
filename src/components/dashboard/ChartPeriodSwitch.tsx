
import React from 'react';
import { Switch } from '@/components/ui/switch';

interface ChartPeriodSwitchProps {
  isMonthView: boolean;
  onToggle: (isMonthView: boolean) => void;
}

const ChartPeriodSwitch = ({ isMonthView, onToggle }: ChartPeriodSwitchProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Graphiques</h3>
      <div className="flex items-center space-x-4 bg-white rounded-full p-2 shadow-lg border border-gray-100">
        <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
          !isMonthView 
            ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md' 
            : 'text-gray-600 hover:text-gray-800'
        }`}>
          7 jours
        </span>
        <Switch
          checked={isMonthView}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600"
        />
        <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
          isMonthView 
            ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md' 
            : 'text-gray-600 hover:text-gray-800'
        }`}>
          1 mois
        </span>
      </div>
    </div>
  );
};

export default ChartPeriodSwitch;
