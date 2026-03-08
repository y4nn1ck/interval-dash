import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIntervalsAuth, useIntervalsActivities, useIntervalsEvents } from '@/hooks/useIntervalsData';
import IntervalsAuth from '@/components/dashboard/IntervalsAuth';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Activity, Clock, Zap, Mountain, Heart, ClipboardList } from 'lucide-react';
import StravaPendingBanner from '@/components/dashboard/StravaPendingBanner';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { IntervalsActivity, IntervalsEvent } from '@/services/intervalsService';
import ActivityAnalysisDialog from '@/components/training-calendar/ActivityAnalysisDialog';
import PlannedWorkoutDialog from '@/components/training-calendar/PlannedWorkoutDialog';
import WeeklySummary from '@/components/training-calendar/WeeklySummary';
import ComplianceIndicator from '@/components/training-calendar/ComplianceIndicator';
import ComplianceEvolutionChart from '@/components/training-calendar/ComplianceEvolutionChart';
import TrainingLoadEvolutionChart from '@/components/training-calendar/TrainingLoadEvolutionChart';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const getSportIcon = (type: string) => {
  const lowerType = (type || '').toLowerCase();
  if (lowerType.includes('ride') || lowerType.includes('cycling') || lowerType.includes('bike')) {
    return '🚴‍♂️';
  }
  if (lowerType.includes('run') || lowerType.includes('running')) {
    return '🏃‍♂️';
  }
  if (lowerType.includes('swim') || lowerType.includes('swimming')) {
    return '🏊‍♂️';
  }
  if (lowerType.includes('hike') || lowerType.includes('walk')) {
    return '🥾';
  }
  if (lowerType.includes('weight') || lowerType.includes('strength')) {
    return '💪';
  }
  if (lowerType.includes('yoga')) {
    return '🧘';
  }
  return '🏃‍♂️';
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes}min`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
};

const TrainingCalendar = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedActivity, setSelectedActivity] = useState<IntervalsActivity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivityEvent, setSelectedActivityEvent] = useState<IntervalsEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IntervalsEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  const { isAuthenticated, isLoading: authLoading } = useIntervalsAuth();

  const weekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);

  const startDateStr = format(currentWeekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');

  const { data: activities = [], isLoading: activitiesLoading, pendingStravaCount } = useIntervalsActivities(
    startDateStr, 
    endDateStr
  );

  const { data: events = [] } = useIntervalsEvents(startDateStr, endDateStr);

  // Map activity ID -> paired event for compliance
  const pairedEventByActivityId = useMemo(() => {
    const map: Record<string, IntervalsEvent> = {};
    events.forEach((event) => {
      if (event.paired_activity_id) {
        map[event.paired_activity_id] = event;
      }
    });
    return map;
  }, [events]);

  // Group ALL events by day (including paired ones)
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, IntervalsEvent[]> = {};
    events.forEach((event) => {
      const eventDate = parseISO(event.start_date_local);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  const activitiesByDay = useMemo(() => {
    const grouped: Record<string, IntervalsActivity[]> = {};
    activities.forEach((activity) => {
      const activityDate = parseISO(activity.start_date_local);
      const dateKey = format(activityDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    return grouped;
  }, [activities]);

  // Ref-based alignment: measure actual planned section heights and apply max
  const plannedRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [plannedMinHeight, setPlannedMinHeight] = useState<number>(0);

  const setPlannedRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    plannedRefs.current[index] = el;
  }, []);

  useEffect(() => {
    // Wait for render, then measure
    const timer = setTimeout(() => {
      let maxH = 0;
      plannedRefs.current.forEach((el) => {
        if (el) {
          // Temporarily remove minHeight to get natural height
          const prev = el.style.minHeight;
          el.style.minHeight = '0px';
          maxH = Math.max(maxH, el.scrollHeight);
          el.style.minHeight = prev;
        }
      });
      if (maxH > 0) {
        setPlannedMinHeight(maxH);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [events, activities, currentWeekStart]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleActivityClick = (activity: IntervalsActivity, pairedEvent?: IntervalsEvent) => {
    setSelectedActivity(activity);
    setSelectedActivityEvent(pairedEvent || null);
    setIsDialogOpen(true);
  };

  const handleEventClick = (event: IntervalsEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const isCurrentWeek = isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  if (authLoading) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-6 md:p-8 space-y-8">
        <div className="space-y-2 opacity-0 animate-fade-in-up">
          <h1 className="text-4xl font-bold gradient-text">Calendrier d'entraînement</h1>
          <p className="text-muted-foreground text-lg">Connectez-vous à Intervals.icu pour voir vos entraînements</p>
        </div>
        <IntervalsAuth />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 opacity-0 animate-fade-in-up">
        <h1 className="text-4xl font-bold gradient-text">Calendrier d'entraînement</h1>
        <p className="text-muted-foreground text-lg">Visualisez vos entraînements semaine par semaine</p>
      </div>

      {/* Week Navigation */}
      <Card className="glass-card opacity-0 animate-fade-in-up-delay-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Semaine du {format(currentWeekStart, 'd MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={isCurrentWeek ? "secondary" : "outline"}
                size="sm"
                onClick={handleThisWeek}
                disabled={isCurrentWeek}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextWeek}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Strava Pending Banner */}
      <StravaPendingBanner count={pendingStravaCount} className="opacity-0 animate-fade-in-up-delay-1" />

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-3 opacity-0 animate-fade-in-up-delay-2">
        {weekDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayActivities = activitiesByDay[dateKey] || [];
          const dayEvents = eventsByDay[dateKey] || [];
          const isToday = isSameDay(day, new Date());
          const hasContent = dayActivities.length > 0 || dayEvents.length > 0;

          return (
            <Card 
              key={dateKey} 
              className={cn(
                "glass-card min-h-[200px] transition-all duration-300 flex flex-col",
                isToday && "ring-2 ring-primary/50 shadow-lg shadow-primary/10"
              )}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {WEEKDAYS[index]}
                  </span>
                  <span className={cn(
                    "text-lg font-bold",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 flex flex-col flex-1">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Planned section with consistent min-height for alignment */}
                    <div
                      ref={setPlannedRef(index)}
                      className="space-y-1.5 flex-shrink-0"
                      style={{ minHeight: plannedMinHeight > 0 ? `${plannedMinHeight}px` : undefined }}
                    >
                      {dayEvents.length > 0 && (
                        <>
                          <div className="flex items-center gap-1.5 px-1">
                            <ClipboardList className="h-3 w-3 text-primary/60" />
                            <span className="text-[10px] font-medium text-primary/60 uppercase tracking-wider">Prévu</span>
                          </div>
                          {dayEvents.map((event) => {
                            const isPaired = !!(event.paired_activity_id && activities.some(a => a.id === event.paired_activity_id));
                            return (
                              <button
                                key={`event-${event.id}`}
                                onClick={() => handleEventClick(event)}
                                className={cn(
                                  "w-full text-left p-2 rounded-lg transition-all duration-200",
                                  "hover:shadow-md hover:scale-[1.02] cursor-pointer",
                                  isPaired
                                    ? "border border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                                    : "border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10",
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-base">{getSportIcon(event.type)}</span>
                                  <span className={cn(
                                    "text-xs font-medium truncate flex-1",
                                    isPaired ? "text-green-400/80" : "text-primary/80"
                                  )}>
                                    {event.name}
                                  </span>
                                  {isPaired && (
                                    <span className="text-[10px] text-green-400/70">✓</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                                  {event.moving_time && event.moving_time > 0 && (
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatDuration(event.moving_time)}
                                    </span>
                                  )}
                                  {event.distance && event.distance > 0 && (
                                    <span>{formatDistance(event.distance)}</span>
                                  )}
                                  {event.icu_training_load && (
                                    <span className={cn(
                                      "font-medium",
                                      isPaired ? "text-green-400/60" : "text-primary/60"
                                    )}>
                                      ~{Math.round(event.icu_training_load)} TSS
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>

                    {/* Separator - always present when there are planned events in the week */}
                    {plannedMinHeight > 0 && (
                      <div className={cn("border-t my-1.5", dayEvents.length > 0 || dayActivities.length > 0 ? "border-border/30" : "border-transparent")} />
                    )}

                    {/* Completed activities */}
                    {dayActivities.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-1">
                          <Activity className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Réalisé</span>
                        </div>
                        {dayActivities.map((activity) => {
                          const pairedEvent = pairedEventByActivityId[activity.id];
                          return (
                            <button
                              key={activity.id}
                              onClick={() => handleActivityClick(activity, pairedEvent)}
                              className={cn(
                                "w-full text-left p-2 rounded-lg transition-all duration-200",
                                "bg-secondary/50 hover:bg-secondary border border-border/50",
                                "hover:shadow-md hover:scale-[1.02] cursor-pointer",
                                "group"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">{getSportIcon(activity.type)}</span>
                                <span className="text-xs font-medium truncate flex-1 group-hover:text-primary transition-colors">
                                  {activity.name}
                                </span>
                                {pairedEvent && (
                                  <ComplianceIndicator activity={activity} plannedEvent={pairedEvent} />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                                {activity.moving_time > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {formatDuration(activity.moving_time)}
                                  </span>
                                )}
                                {activity.distance > 0 && (
                                  <span>{formatDistance(activity.distance)}</span>
                                )}
                                {activity.icu_training_load && (
                                  <span className="text-orange-400 font-medium">
                                    {Math.round(activity.icu_training_load)} TSS
                                  </span>
                                )}
                              </div>
                              {activity.icu_average_watts && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-400">
                                  <Zap className="h-2.5 w-2.5" />
                                  {Math.round(activity.icu_average_watts)}W moy
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!hasContent && (
                      <div className="flex items-center justify-center py-4 text-muted-foreground/50">
                        <span className="text-xs">Repos</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <WeeklySummary activities={activities} events={events} />

      {/* Training Load Evolution */}
      <TrainingLoadEvolutionChart />

      {/* Compliance Evolution Chart */}
      <ComplianceEvolutionChart currentWeekStart={currentWeekStart} />

      {/* Analysis Dialog */}
      <ActivityAnalysisDialog
        activity={selectedActivity}
        plannedEvent={selectedActivityEvent}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedActivity(null);
          setSelectedActivityEvent(null);
        }}
      />

      {/* Planned Workout Dialog */}
      <PlannedWorkoutDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={() => {
          setIsEventDialogOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default TrainingCalendar;
