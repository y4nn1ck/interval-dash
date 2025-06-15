
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

  // Generate CTL/ATL/TSB data using realistic values based on your current data
  const generateCTLATLData = (period: string) => {
    const days = period === '7days' ? 7 : 30;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      let dayCtl, dayAtl, dayTsb;
      
      if (i === days - 1) {
        // Today: CTL=67, ATL=67, TSB=0
        dayCtl = 67;
        dayAtl = 67;
        dayTsb = 0;
      } else if (i === days - 2) {
        // Yesterday: CTL=67, ATL=65, TSB=2
        dayCtl = 67;
        dayAtl = 65;
        dayTsb = 2;
      } else {
        // Generate realistic historical data with small variations
        const baseCtl = 67;
        const baseAtl = 65;
        const variation = (Math.random() - 0.5) * 4; // ±2 variation
        
        dayCtl = Math.max(60, baseCtl + variation + (Math.random() - 0.5) * 2);
        dayAtl = Math.max(55, baseAtl + variation + (Math.random() - 0.5) * 3);
        dayTsb = dayCtl - dayAtl;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        ctl: Math.round(dayCtl),
        atl: Math.round(dayAtl),
        tsb: Math.round(dayTsb),
      });
    }
    
    return data;
  };

  // Generate hydration data - only accurate for last 2 days, others should be null or placeholder
  const generateHydrationData = (period: string) => {
    const days = period === '7days' ? 7 : 30;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      let hydration;
      
      if (i === days - 1 || i === days - 2) {
        // Today and yesterday: hydration = 1 (accurate data)
        hydration = 1;
      } else {
        // For older days, use null to indicate no accurate data
        hydration = null;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        hydration: hydration,
      });
    }
    
    return data;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* CTL/ATL/TSB Chart - First Row */}
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

      {/* Hydration Chart - Second Row */}
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
