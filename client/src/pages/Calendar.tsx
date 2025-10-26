import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  Loader2,
  Beer
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, subDays, isPast, isYesterday } from "date-fns";
import { authQueryFn } from "@/lib/queryClient";
import type { AuthResponse } from "@shared/schema";
import { RatingDialog } from "@/components/RatingDialog";

interface ScheduledPregame {
  id: string;
  participantEmail: string;
  participantId?: string;
  participantName: string;
  participantImage?: string;
  date: string; // YYYY-MM-DD format
  time: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

// Convert military time (HH:MM) to 12-hour format with AM/PM
function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function Calendar() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [pregameToReview, setPregameToReview] = useState<ScheduledPregame | null>(null);

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;
  const currentUserEmail = currentUser?.email || "";

  // Fetch pregames for current user from API (JWT automatically provides school scoping)
  const { data: pregamesData, isLoading } = useQuery({
    queryKey: ['/api/pregames/calendar'],
    enabled: !!currentUser?.id,
    refetchInterval: 10000, // Refresh every 10 seconds to stay in sync
  });

  // Fetch reviews submitted BY current user to check which pregames have been reviewed
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews/my-reviews'],
    enabled: !!currentUser?.id,
  });

  // Transform API data to match component structure
  const scheduledPregames: ScheduledPregame[] = (pregamesData as any)?.pregames?.map((pregame: any) => {
    // Check if current user is creator or participant to determine the "other" person
    const isCreator = pregame.creatorEmail === currentUserEmail;
    const otherUserEmail = isCreator ? pregame.participantEmail : pregame.creatorEmail;
    const otherUserId = isCreator ? pregame.participantId : pregame.creatorId;
    
    // Create display name from email (simplified approach)
    const participantName = otherUserEmail.includes('@') ? 
      otherUserEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim() : 
      'Unknown User';
    
    return {
      id: pregame.id,
      participantEmail: otherUserEmail,
      participantId: otherUserId,
      participantName,
      participantImage: undefined, // Will be enhanced later with proper user lookups
      date: pregame.date,
      time: pregame.time,
      location: pregame.location || "",
      notes: pregame.notes || "",
      createdAt: pregame.createdAt
    };
  }) || [];

  // Get calendar grid - Only Saturdays
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay()); // Start from Sunday
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay())); // End on Saturday
  
  // Get all days in the calendar view and filter to only Saturdays
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const calendarDays = allDays.filter(day => day.getDay() === 6); // 6 = Saturday

  // Group pregames by date
  const pregamesByDate = scheduledPregames.reduce((acc, pregame) => {
    const date = pregame.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(pregame);
    return acc;
  }, {} as Record<string, ScheduledPregame[]>);

  // Check for pregames from the past that need to be reviewed
  useEffect(() => {
    if (!currentUser?.id || !scheduledPregames.length) return;

    const reviews = (reviewsData as any)?.reviews || [];
    const reviewedPregameIds = new Set(reviews.map((r: any) => r.pregameId));

    // Find yesterday's pregames that haven't been reviewed
    const yesterday = subDays(new Date(), 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    
    // Find the first unreviewed pregame from yesterday
    const unreviewedPregame = scheduledPregames.find(pregame => {
      const pregameDate = parseISO(pregame.date);
      return isYesterday(pregameDate) && !reviewedPregameIds.has(pregame.id);
    });

    if (unreviewedPregame && !ratingDialogOpen) {
      setPregameToReview(unreviewedPregame);
      setRatingDialogOpen(true);
    }
  }, [scheduledPregames, reviewsData, currentUser?.id, ratingDialogOpen]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
    setSelectedDate(null); // Clear selected date when navigating
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const selectedDatePregames = selectedDate 
    ? pregamesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  // No longer needed - we only show Saturdays
  // const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
              Please log in to view your pregame calendar.
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
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="calendar-title">Calendar</h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              data-testid="button-prev-month"
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 sm:min-w-[200px] text-center">
              <h2 className="text-lg sm:text-xl font-semibold" data-testid="current-month">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              data-testid="button-next-month"
              className="shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar Grid - Saturdays Only */}
          <div className="lg:col-span-2">
            <Card className="w-full overflow-hidden">
              <CardContent className="p-2 sm:p-4">
                {/* Header indicating Saturday-only view */}
                <div className="text-center mb-4">
                  <h3 className="text-sm sm:text-base font-medium text-muted-foreground">Saturdays in {format(currentDate, 'MMMM yyyy')}</h3>
                </div>

                {/* Saturday Tiles - Grid layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {calendarDays.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayPregames = pregamesByDate[dayStr] || [];
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);

                    return (
                      <Button
                        key={dayStr}
                        variant={isSelected ? "default" : "ghost"}
                        className={`
                          h-24 sm:h-28 p-2 flex flex-col items-center justify-center relative touch-manipulation
                          ${!isCurrentMonth ? 'opacity-50' : ''}
                          ${isTodayDate ? 'ring-2 ring-primary' : ''}
                          hover:bg-muted
                        `}
                        onClick={() => handleDateClick(day)}
                        data-testid={`calendar-day-${dayStr}`}
                      >
                        <div className="flex flex-col items-center gap-1 relative z-20">
                          <span className="text-xs text-muted-foreground">Saturday</span>
                          <span className={`text-lg sm:text-2xl font-bold ${isTodayDate ? 'text-primary' : ''}`}>
                            {format(day, 'd')}
                          </span>
                          <span className="text-xs text-muted-foreground">{format(day, 'MMM')}</span>
                        </div>
                        
                        {/* Pregame indicator - Beer icon */}
                        {dayPregames.length > 0 && (
                          <div className="absolute top-1 right-1 z-10" data-testid={`beer-icon-${dayStr}`}>
                            <Beer className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 dark:text-orange-400" strokeWidth={2.5} />
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Details */}
          <div className="space-y-4">
            <Card className="w-full">
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-sm sm:text-base" data-testid="selected-date-header">
                  {selectedDate 
                    ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                    : 'Select a date'
                  }
                </h3>
                
                {isLoading && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Loading pregames...</p>
                  </div>
                )}

                {selectedDate && selectedDatePregames.length === 0 && !isLoading && (
                  <div className="text-center py-4 sm:py-6">
                    <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-xs sm:text-sm">No pregames scheduled</p>
                  </div>
                )}

                {selectedDatePregames.length > 0 && (
                  <div className="space-y-3">
                    {selectedDatePregames.map(pregame => (
                      <div
                        key={pregame.id}
                        className="border rounded-lg p-3 touch-manipulation"
                        data-testid={`selected-pregame-${pregame.id}`}
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm sm:text-base break-words">Pregaming with {pregame.participantName}</h4>
                          
                          <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0" />
                              <span>{formatTime12Hour(pregame.time)}</span>
                            </div>
                            
                            {pregame.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="break-words">{pregame.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Rating Dialog */}
      {pregameToReview && pregameToReview.participantId && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          pregameId={pregameToReview.id}
          revieweeId={pregameToReview.participantId}
          revieweeName={pregameToReview.participantName}
          pregameDate={format(parseISO(pregameToReview.date), 'MMMM d, yyyy')}
        />
      )}
    </div>
  );
}