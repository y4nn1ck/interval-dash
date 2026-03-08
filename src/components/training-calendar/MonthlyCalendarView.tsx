import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Clock, ClipboardList, Activity } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { IntervalsActivity, IntervalsEvent } from '@/services/intervalsService';
import ComplianceIndicator from './ComplianceIndicator';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const getSportIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('ride') || t.includes('cycling') || t.includes('bike')) return '🚴‍♂️';
  if (t.includes('run') || t.includes('running')) return '🏃‍♂️';
  if (t.includes('swim') || t.includes('swimming')) return '🏊‍♂️';
  if (t.includes('hike') || t.includes('walk')) return '🥾';
  if (t.includes('weight') || t.includes('strength')) return '💪';
  if (t.includes('yoga')) return '🧘';
  return '🏃‍♂️';
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
};

const formatDistance = (meters: number) => {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
};

interface MonthlyCalendarViewProps {
  currentMonth: Date;
  activities: IntervalsActivity[];
  events: IntervalsEvent[];
  isLoading: boolean;
  onActivityClick: (activity: IntervalsActivity, pairedEvent?: IntervalsEvent) => void;
  onEventClick: (event: IntervalsEvent) => void;
}

const MonthlyCalendarView = ({
  currentMonth,
  activities,
  events,
  isLoading,
  onActivityClick,
  onEventClick,
}: MonthlyCalendarViewProps) => {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const activitiesByDay = useMemo(() => {
    const grouped: Record<string, IntervalsActivity[]> = {};
    activities.forEach((a) => {
      const key = format(parseISO(a.start_date_local), 'yyyy-MM-dd');
      (grouped[key] ||= []).push(a);
    });
    return grouped;
  }, [activities]);

  const eventsByDay = useMemo(() => {
    const grouped: Record<string, IntervalsEvent[]> = {};
    events.forEach((e) => {
      const key = format(parseISO(e.start_date_local), 'yyyy-MM-dd');
      (grouped[key] ||= []).push(e);
    });
    return grouped;
  }, [events]);

  const pairedEventByActivityId = useMemo(() => {
    const map: Record<string, IntervalsEvent> = {};
    events.forEach((e) => {
      if (e.paired_activity_id) map[e.paired_activity_id] = e;
    });
    return map;
  }, [events]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <div className="space-y-1 opacity-0 animate-fade-in-up-delay-2">
      {/* Header row */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayActivities = activitiesByDay[dateKey] || [];
            const dayEvents = eventsByDay[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <Card
                key={dateKey}
                className={cn(
                  "glass-card min-h-[120px] transition-all duration-300 flex flex-col",
                  isToday && "ring-2 ring-primary/50 shadow-lg shadow-primary/10",
                  !isCurrentMonth && "opacity-40"
                )}
              >
                <CardHeader className="pb-1 pt-2 px-2">
                  <span className={cn(
                    "text-sm font-bold",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </CardHeader>
                <CardContent className="px-1.5 pb-1.5 flex flex-col flex-1 overflow-hidden">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-0.5 overflow-y-auto max-h-[140px] scrollbar-thin">
                      {/* Planned events */}
                      {dayEvents.map((event) => {
                        const isPaired = !!(event.paired_activity_id && activities.some(a => a.id === event.paired_activity_id));
                        return (
                          <button
                            key={`ev-${event.id}`}
                            onClick={() => onEventClick(event)}
                            className={cn(
                              "w-full text-left px-1.5 py-1 rounded transition-all duration-200 cursor-pointer",
                              "hover:scale-[1.02]",
                              isPaired
                                ? "border border-dashed border-green-500/30 bg-green-500/5"
                                : "border border-dashed border-primary/40 bg-primary/5"
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{getSportIcon(event.type)}</span>
                              <span className={cn(
                                "text-[9px] font-medium truncate",
                                isPaired ? "text-green-400/80" : "text-primary/80"
                              )}>
                                {event.name}
                              </span>
                              {isPaired && <span className="text-[8px] text-green-400/70">✓</span>}
                            </div>
                            {event.icu_training_load && (
                              <span className="text-[8px] text-muted-foreground">
                                ~{Math.round(event.icu_training_load)} TSS
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Completed activities */}
                      {dayActivities.map((activity) => {
                        const pairedEvent = pairedEventByActivityId[activity.id];
                        return (
                          <button
                            key={activity.id}
                            onClick={() => onActivityClick(activity, pairedEvent)}
                            className={cn(
                              "w-full text-left px-1.5 py-1 rounded transition-all duration-200 cursor-pointer",
                              "bg-secondary/50 hover:bg-secondary border border-border/50",
                              "hover:scale-[1.02] group"
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{getSportIcon(activity.type)}</span>
                              <span className="text-[9px] font-medium truncate flex-1 group-hover:text-primary transition-colors">
                                {activity.name}
                              </span>
                              {pairedEvent && (
                                <ComplianceIndicator activity={activity} plannedEvent={pairedEvent} />
                              )}
                            </div>
                            <div className="flex gap-1 text-[8px] text-muted-foreground">
                              {activity.moving_time > 0 && (
                                <span>{formatDuration(activity.moving_time)}</span>
                              )}
                              {activity.icu_training_load && (
                                <span className="text-orange-400 font-medium">
                                  {Math.round(activity.icu_training_load)}TSS
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MonthlyCalendarView;
