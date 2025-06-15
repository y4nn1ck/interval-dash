
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { garminService, GarminDailyStats, GarminActivity, GarminSleepData } from '@/services/garminService';
import { toast } from 'sonner';

export const useGarminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await garminService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateAuth = async () => {
    try {
      const authUrl = await garminService.initiateAuth();
      window.open(authUrl, '_blank');
    } catch (error) {
      toast.error('Failed to initiate Garmin authentication');
    }
  };

  const syncData = async () => {
    try {
      await garminService.syncData();
      toast.success('Data synced successfully');
    } catch (error) {
      toast.error('Failed to sync data');
    }
  };

  return {
    isAuthenticated,
    isLoading,
    initiateAuth,
    syncData,
    checkAuthStatus
  };
};

export const useGarminDailyStats = (date: string) => {
  return useQuery({
    queryKey: ['garminDailyStats', date],
    queryFn: () => garminService.getDailyStats(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGarminWeeklyStats = () => {
  return useQuery({
    queryKey: ['garminWeeklyStats'],
    queryFn: () => garminService.getWeeklyStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGarminActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: ['garminActivities', limit],
    queryFn: () => garminService.getActivities(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGarminSleepData = (date: string) => {
  return useQuery({
    queryKey: ['garminSleepData', date],
    queryFn: () => garminService.getSleepData(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
