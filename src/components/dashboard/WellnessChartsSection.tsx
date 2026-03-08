import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RestingHRChart from './RestingHRChart';
import SleepChart from './SleepChart';
import { useIntervalsWeeklyStats } from '@/hooks/useIntervalsData';

const WellnessChartsSection = () => {
  const { data: weeklyStats } = useIntervalsWeeklyStats();

  const generateRestingHRData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      let restingHR = 0;
      
      if (weeklyStats && weeklyStats.length > 0) {
        const apiData = weeklyStats.find(stat => stat.date === dateStr);
        if (apiData && apiData.resting_hr !== null && apiData.resting_hr !== undefined) {
          restingHR = apiData.resting_hr;
        }
      }
      
      if (!restingHR) {
        const fallbackValues = [50, 48, 52, 49, 51, 50, 49];
        restingHR = fallbackValues[i];
      }
      
      data.push({ date: dateStr, resting_hr: restingHR });
    }
    return data;
  };

  const generateSleepData = () => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      let sleepHours = null;
      
      if (weeklyStats && weeklyStats.length > 0) {
        const apiData = weeklyStats.find(stat => stat.date === dateStr);
        if (apiData && apiData.sleep_secs !== null && apiData.sleep_secs !== undefined) {
          sleepHours = apiData.sleep_secs / 3600;
        }
      }
      
      if (sleepHours === null) {
        const fallbackValues = [7.5, 8.2, 6.8, 7.9, 8.1, 6.5, 8.5];
        sleepHours = fallbackValues[i];
      }
      
      data.push({ date: dateStr, sleep_hours: sleepHours });
    }
    return data;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Sommeil quotidien
            <span className="text-muted-foreground text-sm font-normal ml-2">(7 jours)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SleepChart data={generateSleepData()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Fréquence cardiaque au repos
            <span className="text-muted-foreground text-sm font-normal ml-2">(7 jours)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RestingHRChart data={generateRestingHRData()} />
        </CardContent>
      </Card>
    </div>
  );
};

export default WellnessChartsSection;
