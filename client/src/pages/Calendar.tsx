import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Loader2,
  Beer,
  Check
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  isSaturday
} from "date-fns";
import { authQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AuthResponse, UserAvailabilitySelect } from "@shared/schema";

type AvailabilityState = 'available' | 'planned';

interface AvailabilityMap {
  [date: string]: AvailabilityState;
}

export default function Calendar() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();
  
  // Debounce timer refs for each date
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;

  // Calculate month boundaries
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');

  // Fetch availability for current month
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery<{ availability: UserAvailabilitySelect[] }>({
    queryKey: ['/api/availability', startDate, endDate],
    enabled: !!currentUser?.id,
  });

  // Convert array to map for easy lookup
  const availabilityMap: AvailabilityMap = (availabilityData?.availability || []).reduce((acc, item) => {
    acc[item.date] = item.state as AvailabilityState;
    return acc;
  }, {} as AvailabilityMap);

  // Mutation for updating availability
  const updateMutation = useMutation({
    mutationFn: async ({ date, state }: { date: string; state: AvailabilityState }) => {
      await apiRequest('PATCH', `/api/availability/${date}`, { state });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting availability
  const deleteMutation = useMutation({
    mutationFn: async (date: string) => {
      await apiRequest('DELETE', `/api/availability/${date}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove availability",
        variant: "destructive",
      });
    },
  });

  // Debounced toggle handler
  const handleDateToggle = useCallback((dateStr: string) => {
    // Clear existing timer for this date
    if (debounceTimers.current[dateStr]) {
      clearTimeout(debounceTimers.current[dateStr]);
    }

    // Get current state
    const currentState = availabilityMap[dateStr];
    let newState: AvailabilityState | null = null;

    // Cycle through states: Empty → available → planned → Empty
    if (!currentState) {
      newState = 'available';
    } else if (currentState === 'available') {
      newState = 'planned';
    } else {
      // planned → Empty (delete)
      newState = null;
    }

    // Optimistically update the UI
    const previousData = queryClient.getQueryData(['/api/availability', startDate, endDate]);
    queryClient.setQueryData(['/api/availability', startDate, endDate], (old: any) => {
      if (!old) return old;
      
      const availability = old.availability || [];
      
      if (newState === null) {
        // Remove from array
        return {
          ...old,
          availability: availability.filter((item: UserAvailabilitySelect) => item.date !== dateStr)
        };
      } else {
        // Update or add
        const existingIndex = availability.findIndex((item: UserAvailabilitySelect) => item.date === dateStr);
        if (existingIndex >= 0) {
          const updated = [...availability];
          updated[existingIndex] = { ...updated[existingIndex], state: newState };
          return { ...old, availability: updated };
        } else {
          return {
            ...old,
            availability: [
              ...availability,
              {
                userId: currentUser!.id,
                date: dateStr,
                state: newState,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            ]
          };
        }
      }
    });

    // Set debounced API call
    debounceTimers.current[dateStr] = setTimeout(() => {
      if (newState === null) {
        deleteMutation.mutate(dateStr, {
          onError: () => {
            // Revert optimistic update on error
            queryClient.setQueryData(['/api/availability', startDate, endDate], previousData);
          }
        });
      } else {
        updateMutation.mutate({ date: dateStr, state: newState }, {
          onError: () => {
            // Revert optimistic update on error
            queryClient.setQueryData(['/api/availability', startDate, endDate], previousData);
          }
        });
      }
      delete debounceTimers.current[dateStr];
    }, 500);
  }, [availabilityMap, currentUser, startDate, endDate, deleteMutation, updateMutation, queryClient]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Generate calendar grid
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render state icon
  const renderStateIcon = (state: AvailabilityState | undefined) => {
    if (state === 'available') {
      return <Check className="h-5 w-5 text-green-500" data-testid="icon-available" />;
    } else if (state === 'planned') {
      return <Beer className="h-5 w-5 text-orange-500" data-testid="icon-planned" />;
    }
    return null;
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authData?.user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to manage your availability.
            </p>
            <Button onClick={() => setLocation("/login")} data-testid="button-login">
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="calendar-title">Availability</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Mark which Saturdays you're available for pregames
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[160px] text-center">
              <h2 className="text-lg font-semibold" data-testid="current-month">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2 border-dashed border-muted-foreground flex items-center justify-center" />
                <span className="text-muted-foreground">Not available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-card border flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-card border flex items-center justify-center">
                  <Beer className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-muted-foreground">Something planned</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {availabilityLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar dates */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    const isSaturdayDate = isSaturday(day);
                    const state = availabilityMap[dayStr];
                    const isSelectable = isCurrentMonth && isSaturdayDate;

                    return (
                      <Button
                        key={dayStr}
                        variant="ghost"
                        className={`
                          h-16 sm:h-20 p-2 flex flex-col items-center justify-center relative
                          ${!isCurrentMonth ? 'opacity-40' : ''}
                          ${!isSaturdayDate ? 'opacity-30 cursor-not-allowed' : ''}
                          ${isTodayDate ? 'ring-2 ring-primary ring-offset-1' : ''}
                        `}
                        onClick={() => isSelectable && handleDateToggle(dayStr)}
                        disabled={!isSelectable}
                        data-testid={`calendar-date-${dayStr}`}
                      >
                        {/* Date number */}
                        <span className={`text-lg font-semibold ${isTodayDate ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        
                        {/* State icon */}
                        {state && (
                          <div className="mt-1">
                            {renderStateIcon(state)}
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p className="font-medium">Only Saturdays can be marked</p>
          <p className="mt-1">Tap any Saturday to toggle: Empty → Available ✅ → Planned 🍺 → Empty</p>
          <p className="mt-1">Changes are saved automatically</p>
        </div>
      </main>
    </div>
  );
}
