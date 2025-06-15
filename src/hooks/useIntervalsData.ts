
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intervalsService, IntervalsDailyStats } from '@/services/intervalsService';
import { useToast } from '@/hooks/use-toast';

export const useIntervalsAuth = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isAuthenticated = false, isLoading } = useQuery({
    queryKey: ['intervals-auth'],
    queryFn: () => intervalsService.checkAuth(),
  });

  const saveApiKeyMutation = useMutation({
    mutationFn: (credentials: { apiKey: string; athleteId: string }) => intervalsService.saveApiKey(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervals-auth'] });
      toast({
        title: "Success",
        description: "Intervals.icu connected successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncDataMutation = useMutation({
    mutationFn: () => intervalsService.syncData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervals-daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['intervals-weekly-stats'] });
      toast({
        title: "Success",
        description: "Data synced successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to sync data",
        variant: "destructive",
      });
    },
  });

  return {
    isAuthenticated,
    isLoading,
    saveApiKey: saveApiKeyMutation.mutate,
    syncData: syncDataMutation.mutate,
    isSaving: saveApiKeyMutation.isPending,
    isSyncing: syncDataMutation.isPending,
  };
};

export const useIntervalsDailyStats = (date: string) => {
  return useQuery({
    queryKey: ['intervals-daily-stats', date],
    queryFn: () => intervalsService.getDailyStats(date),
    enabled: !!date,
  });
};

export const useIntervalsWeeklyStats = () => {
  return useQuery({
    queryKey: ['intervals-weekly-stats'],
    queryFn: () => intervalsService.getWeeklyStats(),
  });
};
