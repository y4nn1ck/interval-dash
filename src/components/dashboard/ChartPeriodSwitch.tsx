
import React from 'react';
import { Switch } from '@/components/ui/switch';

interface ChartPeriodSwitchProps {
  isMonthView: boolean;
  onToggle: (isMonthView: boolean) => void;
}

const ChartPeriodSwitch = ({ isMonthView, onToggle }: ChartPeriodSwitchProps) => {
  return (
    <div className="flex items-center space-x-2 bg-white rounded-full p-1.5 shadow-md border border-gray-100">
      <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-200 ${
        !isMonthView 
          ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm' 
          : 'text-gray-600 hover:text-gray-800'
      }`}>
        7j
      </span>
      <Switch
        checked={isMonthView}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 scale-75"
      />
      <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-200 ${
        isMonthView 
          ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm' 
          : 'text-gray-600 hover:text-gray-800'
      }`}>
        1m
      </span>
    </div>
  );
};

export default ChartPeriodSwitch;
