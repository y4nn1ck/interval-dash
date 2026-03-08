import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StravaPendingBannerProps {
  count: number;
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const StravaPendingBanner = ({ count, className, onRefresh, isRefreshing }: StravaPendingBannerProps) => {
  if (count <= 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg",
      "bg-orange-500/10 border border-orange-500/20 text-orange-400",
      className
    )}>
      <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
      <span className="text-xs font-medium">
        {count} activité{count > 1 ? 's' : ''} Strava en attente de synchronisation
      </span>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-auto h-6 px-2 text-[10px] text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
          Réessayer
        </Button>
      )}
      {!onRefresh && <CloudOff className="h-3 w-3 ml-auto opacity-60" />}
    </div>
  );
};

export default StravaPendingBanner;
