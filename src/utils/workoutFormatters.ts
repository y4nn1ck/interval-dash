
export const formatDuration = (seconds?: number) => {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const formatDistance = (meters?: number) => {
  if (!meters) return null;
  return (meters / 1000).toFixed(1) + ' km';
};

export const getFeelingEmoji = (feeling: number) => {
  if (feeling >= 4) return '😊';
  if (feeling >= 3) return '😐';
  return '😔';
};

export const isPowerActivity = (type: string) => {
  return ['Run', 'Ride', 'VirtualRide', 'Bike'].includes(type);
};
