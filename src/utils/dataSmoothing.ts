
interface PowerData {
  time: number;
  power: number;
  rpm?: number;
}

export const smoothPowerData = (data: PowerData[], windowSize: number = 3): PowerData[] => {
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.ceil(windowSize / 2));
    const slice = data.slice(start, end);
    const avgPower = slice.reduce((sum, p) => sum + p.power, 0) / slice.length;
    const avgRpm = slice.reduce((sum, p) => sum + (p.rpm || 0), 0) / slice.length;
    
    return {
      time: point.time,
      power: avgPower,
      rpm: avgRpm
    };
  });
};
