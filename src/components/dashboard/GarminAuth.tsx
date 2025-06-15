
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, CheckCircle } from 'lucide-react';
import { useGarminAuth } from '@/hooks/useGarminData';

const GarminAuth = () => {
  const { isAuthenticated, isLoading, initiateAuth, syncData } = useGarminAuth();

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2">Checking Garmin connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Connect to Garmin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Connect your Garmin account to sync your personal fitness data and see real-time metrics.
          </p>
          <Button 
            onClick={initiateAuth}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Activity className="h-4 w-4 mr-2" />
            Connect Garmin Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Garmin Connected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Your Garmin account is connected and syncing data.
        </p>
        <Button 
          onClick={syncData}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Data Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default GarminAuth;
