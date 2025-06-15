
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, RefreshCw, CheckCircle, Key, User } from 'lucide-react';
import { useIntervalsAuth } from '@/hooks/useIntervalsData';

const IntervalsAuth = () => {
  const [apiKey, setApiKey] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const { isAuthenticated, isLoading, saveApiKey, syncData, isSaving, isSyncing } = useIntervalsAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim() && athleteId.trim()) {
      saveApiKey({ apiKey: apiKey.trim(), athleteId: athleteId.trim() });
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2">Checking Intervals.icu connection...</span>
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
            Connect to Intervals.icu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Connect your Intervals.icu account to sync your training data and analytics.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>How to get your credentials:</strong>
            </p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://intervals.icu/settings" target="_blank" rel="noopener noreferrer" className="underline">intervals.icu/settings</a></li>
              <li>Scroll down to "Developer" section and copy your API key</li>
              <li>Your Athlete ID is visible in your profile URL (e.g., intervals.icu/athletes/12345)</li>
            </ol>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Intervals.icu API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="athleteId">Athlete ID</Label>
              <Input
                id="athleteId"
                type="text"
                placeholder="Enter your Athlete ID (e.g., 12345)"
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSaving || !apiKey.trim() || !athleteId.trim()}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Connect Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Intervals.icu Connected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Your Intervals.icu account is connected and syncing data.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>Athlete ID: {localStorage.getItem('intervals_athlete_id')}</span>
        </div>
        <Button 
          onClick={() => syncData()}
          variant="outline"
          className="w-full"
          disabled={isSyncing}
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Data Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default IntervalsAuth;
