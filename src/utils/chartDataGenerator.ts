
interface PowerData {
  time: number;
  power: number;
  rpm?: number;
}

interface ChartDataPoint {
  time: number;
  power1: number | null;
  power2: number | null;
  rpm1: number | null;
  rpm2: number | null;
}

export const generateChartData = (
  file1Data: PowerData[] | null,
  file2Data: PowerData[] | null
): ChartDataPoint[] => {
  if (!file1Data || !file2Data) return [];

  const maxLength = Math.max(file1Data.length, file2Data.length);
  const chartData: ChartDataPoint[] = [];

  for (let i = 0; i < maxLength; i++) {
    chartData.push({
      time: i / 60, // Already in minutes from data processing
      power1: file1Data[i]?.power || null,
      power2: file2Data[i]?.power || null,
      rpm1: file1Data[i]?.rpm || null,
      rpm2: file2Data[i]?.rpm || null,
    });
  }

  return chartData;
};
