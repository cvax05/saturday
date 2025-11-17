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
  isToday, 
  addMonths,
  addDays,
  isSaturday,
  startOfDay
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

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;

  // Calculate date range - show current month + next 2 months of Saturdays
  const monthStart = startOfMonth(currentDate);
  const rangeEnd = endOfMonth(addMonths(currentDate, 2));
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(rangeEnd, 'yyyy-MM-dd');

  // Fetch availability for current month
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery<{ availability: UserAvailabilitySelect[] }>({
    queryKey: ['/api/availability', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
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
      queryClient.invalidateQueries({ queryKey: ['/api/availability', startDate, endDate] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/availability', startDate, endDate] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove availability",
        variant: "destructive",
      });
    },
  });

  // Direct toggle handler with optimistic updates
  const handleDateToggle = useCallback((dateStr: string) => {
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

    // Optimistically update the UI immediately
    const queryKey = ['/api/availability', startDate, endDate];
    const previousData = queryClient.getQueryData(queryKey);
    
    queryClient.setQueryData(queryKey, (old: any) => {
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ]
          };
        }
      }
    });

    // Trigger API call immediately
    if (newState === null) {
      deleteMutation.mutate(dateStr, {
        onError: () => {
          // Revert optimistic update on error
          queryClient.setQueryData(queryKey, previousData);
        }
      });
    } else {
      updateMutation.mutate({ date: dateStr, state: newState }, {
        onError: () => {
          // Revert optimistic update on error
          queryClient.setQueryData(queryKey, previousData);
        }
      });
    }
  }, [availabilityMap, currentUser, startDate, endDate, deleteMutation, updateMutation]);

  // Get only Saturdays in the range
  const getSaturdays = (start: Date, end: Date): Date[] => {
    const saturdays: Date[] = [];
    let current = new Date(start);
    
    // Find first Saturday
    while (!isSaturday(current) && current <= end) {
      current = addDays(current, 1);
    }
    
    // Collect all Saturdays
    while (current <= end) {
      saturdays.push(new Date(current));
      current = addDays(current, 7);
    }
    
    return saturdays;
  };
  
  const saturdays = getSaturdays(monthStart, rangeEnd);
  
  // Filter out past Saturdays
  const today = startOfDay(new Date());
  const upcomingSaturdays = saturdays.filter((saturday: Date) => saturday >= today);

  // Group Saturdays by month for section headers
  const saturdaysByMonth = upcomingSaturdays.reduce((acc: Record<string, Date[]>, saturday: Date) => {
    const monthKey = format(saturday, 'MMMM yyyy');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(saturday);
    return acc;
  }, {} as Record<string, Date[]>);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(addMonths(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="calendar-title">Availability</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Mark which Saturdays you're available for pregames
          </p>
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

        {/* Saturdays List */}
        <div className="space-y-6">
          {availabilityLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading Saturdays...</p>
              </CardContent>
            </Card>
          ) : upcomingSaturdays.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming Saturdays found</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(saturdaysByMonth).map(([monthLabel, monthSaturdays]) => (
              <div key={monthLabel} className="space-y-3">
                {/* Month Section Header */}
                <h2 className="text-lg font-semibold text-muted-foreground px-1" data-testid={`month-header-${monthLabel}`}>
                  {monthLabel}
                </h2>
                
                {/* Saturdays in this month */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {monthSaturdays.map(saturday => {
                    const dayStr = format(saturday, 'yyyy-MM-dd');
                    const isTodayDate = isToday(saturday);
                    const state = availabilityMap[dayStr];

                    return (
                      <Card
                        key={dayStr}
                        className={`
                          overflow-visible hover-elevate active-elevate-2 cursor-pointer transition-all
                          ${isTodayDate ? 'ring-2 ring-primary' : ''}
                          ${state === 'available' ? 'bg-green-500/10 border-green-500/30' : ''}
                          ${state === 'planned' ? 'bg-orange-500/10 border-orange-500/30' : ''}
                        `}
                        onClick={() => handleDateToggle(dayStr)}
                        data-testid={`calendar-date-${dayStr}`}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Date Display */}
                            <div className="flex flex-col">
                              <span className="text-2xl font-bold">
                                {format(saturday, 'd')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(saturday, 'MMM')}
                              </span>
                            </div>
                            
                            {/* Full Date Label */}
                            <div>
                              <div className="font-medium">
                                {format(saturday, 'EEEE')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(saturday, 'MMMM d, yyyy')}
                              </div>
                            </div>
                          </div>

                          {/* State Icon */}
                          <div className="flex items-center gap-2">
                            {state === 'available' && (
                              <div className="flex items-center gap-2 text-green-600">
                                <Check className="h-6 w-6" data-testid="icon-available" />
                                <span className="text-sm font-medium hidden sm:inline">Available</span>
                              </div>
                            )}
                            {state === 'planned' && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <Beer className="h-6 w-6" data-testid="icon-planned" />
                                <span className="text-sm font-medium hidden sm:inline">Planned</span>
                              </div>
                            )}
                            {!state && (
                              <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
