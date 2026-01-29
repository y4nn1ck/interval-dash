
interface PowerData {
  time: number;
  power: number;
  rpm?: number;
}

interface ChartDataPoint {
  time: number;
  power: number | null;
  cadence: number | null;
  heart_rate: number | null;
}

// Enhanced moving average with Gaussian-like weighting for smoother results
export const smoothPowerData = (data: PowerData[], windowSize: number = 5): PowerData[] => {
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.ceil(windowSize / 2));
    const slice = data.slice(start, end);
    
    // Weighted average - center points have more weight
    const weights = slice.map((_, i) => {
      const distance = Math.abs(i - Math.floor(slice.length / 2));
      return Math.exp(-distance * 0.5);
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    const avgPower = slice.reduce((sum, p, i) => sum + p.power * weights[i], 0) / totalWeight;
    const avgRpm = slice.reduce((sum, p, i) => sum + (p.rpm || 0) * weights[i], 0) / totalWeight;
    
    return {
      time: point.time,
      power: avgPower,
      rpm: avgRpm
    };
  });
};

// General purpose smoothing for chart data with larger window
export const smoothChartData = (data: ChartDataPoint[], windowSize: number = 7): ChartDataPoint[] => {
  if (data.length === 0) return data;
  
  return data.map((point, index) => {
    const halfWindow = Math.floor(windowSize / 2);
    const start = Math.max(0, index - halfWindow);
    const end = Math.min(data.length, index + halfWindow + 1);
    const slice = data.slice(start, end);
    
    // Gaussian-like weights for smoother transitions
    const weights = slice.map((_, i) => {
      const distance = Math.abs(i - (index - start));
      return Math.exp(-distance * distance * 0.15);
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    const smoothValue = (key: 'power' | 'cadence' | 'heart_rate') => {
      const validValues = slice.filter(s => s[key] !== null && s[key] !== undefined);
      if (validValues.length === 0) return null;
      
      let weightedSum = 0;
      let weightSum = 0;
      slice.forEach((s, i) => {
        if (s[key] !== null && s[key] !== undefined) {
          weightedSum += (s[key] as number) * weights[i];
          weightSum += weights[i];
        }
      });
      
      return weightSum > 0 ? weightedSum / weightSum : null;
    };
    
    return {
      time: point.time,
      power: smoothValue('power'),
      cadence: smoothValue('cadence'),
      heart_rate: smoothValue('heart_rate')
    };
  });
};
