
export const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'High': return 'bg-red-100 text-red-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getRPEColor = (rpe: number) => {
  if (rpe >= 9) return 'bg-red-100 text-red-800';
  if (rpe >= 7) return 'bg-orange-100 text-orange-800';
  if (rpe >= 5) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export const getFeelingColor = (feeling: number) => {
  if (feeling >= 4) return 'bg-green-100 text-green-800';
  if (feeling >= 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export const getConformityColor = (score: number) => {
  if (score >= 100) return 'bg-green-100 text-green-800';
  if (score >= 75) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};
