import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  Plus,
  MessageSquare,
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

  // Get calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay()); // Start from Sunday
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay())); // End on Saturday
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

  const handleMessageParticipant = (pregame: ScheduledPregame) => {
    setLocation(`/messages/${pregame.participantEmail}`);
  };

  const selectedDatePregames = selectedDate 
    ? pregamesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="w-full overflow-hidden">
              <CardContent className="p-2 sm:p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.substring(0, 1)}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
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
                          h-14 sm:h-20 p-0.5 sm:p-1 flex flex-col items-center justify-start relative touch-manipulation
                          ${!isCurrentMonth ? 'opacity-50' : ''}
                          ${isTodayDate ? 'ring-1 sm:ring-2 ring-primary ring-opacity-50' : ''}
                          hover:bg-muted
                        `}
                        onClick={() => handleDateClick(day)}
                        data-testid={`calendar-day-${dayStr}`}
                      >
                        <span className={`text-xs sm:text-sm ${isTodayDate ? 'font-bold' : ''} relative z-20`}>
                          {format(day, 'd')}
                        </span>
                        
                        {/* Pregame indicator - Beer icon */}
                        {dayPregames.length > 0 && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center pt-4 sm:pt-6 pointer-events-none" data-testid={`beer-icon-${dayStr}`}>
                            <Beer className="h-10 w-10 sm:h-16 sm:w-16 text-orange-500 dark:text-orange-400 drop-shadow-lg" strokeWidth={3} />
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
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                            <AvatarImage src={pregame.participantImage} alt={pregame.participantName} />
                            <AvatarFallback className="text-xs sm:text-sm">
                              {pregame.participantName.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs sm:text-sm mb-1 break-words">Pregaming with {pregame.participantName}</h4>
                            
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span className="truncate">{pregame.time}</span>
                              </div>
                              
                              {pregame.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{pregame.location}</span>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMessageParticipant(pregame)}
                              className="mt-2 min-h-[36px] text-xs w-full sm:w-auto"
                              data-testid={`button-message-selected-${pregame.id}`}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Message
                            </Button>
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