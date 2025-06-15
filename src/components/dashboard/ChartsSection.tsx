
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CTLATLTSBChart from './CTLATLTSBChart';
import HydrationChart from './HydrationChart';
import ChartPeriodSwitch from './ChartPeriodSwitch';

interface ChartsSectionProps {
  ctl: number;
  atl: number;
}

const ChartsSection = ({ ctl, atl }: ChartsSectionProps) => {
  const [ctlatlPeriod, setCtlatlPeriod] = useState('7days');
  const [hydrationPeriod, setHydrationPeriod] = useState('7days');

  // Generate CTL/ATL/TSB data using values from the KPI cards
  const generateCTLATLData = (period: string) => {
    const days = period === '7days' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      // Use actual values from the cards with some variation
      const baseCtl = ctl;
      const baseAtl = atl;
      const variation = (Math.random() - 0.5) * 10; // ±5 variation
      
      const dayCtl = Math.max(30, baseCtl + variation + (i - days/2) * 0.5);
      const dayAtl = Math.max(20, baseAtl + variation + (i - days/2) * 0.3);
      const dayTsb = dayCtl - dayAtl;
      
      return {
        date: date.toISOString().split('T')[0],
        ctl: Math.round(dayCtl),
        atl: Math.round(dayAtl),
        tsb: Math.round(dayTsb),
      };
    });
  };

  // Generate hydration data with values between 1-5 (not liters)
  const generateHydrationData = (period: string) => {
    const days = period === '7days' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        hydration: Math.round((1 + Math.random() * 4) * 10) / 10, // Between 1.0 and 5.0
      };
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Évolution CTL, ATL et TSB
            </CardTitle>
            <ChartPeriodSwitch
              isMonthView={ctlatlPeriod === '1month'}
              onToggle={(isMonthView) => setCtlatlPeriod(isMonthView ? '1month' : '7days')}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CTLATLTSBChart 
            data={generateCTLATLData(ctlatlPeriod)} 
            selectedPeriod={ctlatlPeriod} 
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Hydratation quotidienne
            </CardTitle>
            <ChartPeriodSwitch
              isMonthView={hydrationPeriod === '1month'}
              onToggle={(isMonthView) => setHydrationPeriod(isMonthView ? '1month' : '7days')}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <HydrationChart 
            data={generateHydrationData(hydrationPeriod)} 
            selectedPeriod={hydrationPeriod} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;
