import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, MessageSquare, Edit, Trash2 } from "lucide-react";
import { format, parseISO, compareAsc } from "date-fns";
import SchedulePregameModal from "@/components/SchedulePregameModal";

interface ScheduledPregame {
  id: string;
  participantId: string;
  participantName: string;
  participantImage?: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export default function Calendar() {
  const [, setLocation] = useLocation();
  const [scheduledPregames, setScheduledPregames] = useState<ScheduledPregame[]>([]);
  const [editingPregame, setEditingPregame] = useState<ScheduledPregame | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadScheduledPregames();
  }, []);

  const loadScheduledPregames = () => {
    const stored = localStorage.getItem('scheduledPregames');
    if (stored) {
      try {
        const pregames = JSON.parse(stored);
        // Sort by date and time
        const sorted = pregames.sort((a: ScheduledPregame, b: ScheduledPregame) => {
          return compareAsc(
            parseISO(`${a.date}T${a.time}`),
            parseISO(`${b.date}T${b.time}`)
          );
        });
        setScheduledPregames(sorted);
      } catch (e) {
        console.error('Error loading scheduled pregames:', e);
        setScheduledPregames([]);
      }
    }
  };

  const handleBack = () => {
    setLocation("/home");
  };

  const handleEditPregame = (pregame: ScheduledPregame) => {
    setEditingPregame(pregame);
    setShowEditModal(true);
  };

  const handleUpdatePregame = (scheduleData: {
    date: string;
    time: string;
    location?: string;
    notes?: string;
  }) => {
    if (!editingPregame) return;

    const updatedPregame = {
      ...editingPregame,
      date: scheduleData.date,
      time: scheduleData.time,
      location: scheduleData.location || "",
      notes: scheduleData.notes || ""
    };

    const updatedPregames = scheduledPregames.map(p => 
      p.id === editingPregame.id ? updatedPregame : p
    );

    setScheduledPregames(updatedPregames);
    localStorage.setItem('scheduledPregames', JSON.stringify(updatedPregames));
    
    setEditingPregame(null);
    setShowEditModal(false);
  };

  const handleDeletePregame = (pregameId: string) => {
    if (confirm('Are you sure you want to delete this scheduled pregame?')) {
      const updatedPregames = scheduledPregames.filter(p => p.id !== pregameId);
      setScheduledPregames(updatedPregames);
      localStorage.setItem('scheduledPregames', JSON.stringify(updatedPregames));
    }
  };

  const handleMessageParticipant = (pregame: ScheduledPregame) => {
    setLocation(`/messages/${pregame.participantId}`);
  };

  const groupPregamesByDate = () => {
    const groups: { [date: string]: ScheduledPregame[] } = {};
    
    scheduledPregames.forEach(pregame => {
      const date = pregame.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(pregame);
    });

    return groups;
  };

  const groupedPregames = groupPregamesByDate();
  const dates = Object.keys(groupedPregames).sort();

  // Separate upcoming and past events
  const today = new Date().toISOString().split('T')[0];
  const upcomingDates = dates.filter(date => date >= today);
  const pastDates = dates.filter(date => date < today);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Calendar</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {scheduledPregames.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Scheduled Pregames</h2>
            <p className="text-muted-foreground mb-4">
              Start chatting with someone and schedule your first pregame!
            </p>
            <Button onClick={() => setLocation("/messages")} data-testid="button-go-messages">
              Go to Messages
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Events */}
            {upcomingDates.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Upcoming Pregames
                </h2>
                <div className="space-y-4">
                  {upcomingDates.map(date => (
                    <div key={date}>
                      <h3 className="font-medium text-sm text-muted-foreground mb-3">
                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="space-y-3">
                        {groupedPregames[date].map(pregame => (
                          <Card key={pregame.id} className="relative" data-testid={`pregame-card-${pregame.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={pregame.participantImage} alt={pregame.participantName} />
                                    <AvatarFallback>
                                      {pregame.participantName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-base mb-1" data-testid={`participant-name-${pregame.id}`}>
                                      {pregame.participantName}
                                    </h4>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span data-testid={`time-${pregame.id}`}>{pregame.time}</span>
                                      </div>
                                      
                                      {pregame.location && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <MapPin className="h-4 w-4" />
                                          <span data-testid={`location-${pregame.id}`}>{pregame.location}</span>
                                        </div>
                                      )}
                                      
                                      {pregame.notes && (
                                        <p className="text-sm text-muted-foreground" data-testid={`notes-${pregame.id}`}>
                                          {pregame.notes}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleMessageParticipant(pregame)}
                                        className="gap-1"
                                        data-testid={`button-message-${pregame.id}`}
                                      >
                                        <MessageSquare className="h-3 w-3" />
                                        Message
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditPregame(pregame)}
                                        className="gap-1"
                                        data-testid={`button-edit-${pregame.id}`}
                                      >
                                        <Edit className="h-3 w-3" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeletePregame(pregame.id)}
                                        className="gap-1"
                                        data-testid={`button-delete-${pregame.id}`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastDates.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Past Pregames
                </h2>
                <div className="space-y-4">
                  {pastDates.reverse().map(date => (
                    <div key={date}>
                      <h3 className="font-medium text-sm text-muted-foreground mb-3">
                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="space-y-3">
                        {groupedPregames[date].map(pregame => (
                          <Card key={pregame.id} className="relative opacity-75" data-testid={`past-pregame-card-${pregame.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={pregame.participantImage} alt={pregame.participantName} />
                                    <AvatarFallback>
                                      {pregame.participantName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-base">
                                        {pregame.participantName}
                                      </h4>
                                      <Badge variant="secondary" className="text-xs">Past</Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{pregame.time}</span>
                                      </div>
                                      
                                      {pregame.location && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <MapPin className="h-4 w-4" />
                                          <span>{pregame.location}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setLocation("/home")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
            data-testid="nav-home"
          >
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setLocation("/messages")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
            data-testid="nav-messages"
          >
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            onClick={() => setLocation("/calendar")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-primary bg-primary/10"
            data-testid="nav-calendar"
          >
            <span className="text-xs font-medium">Calendar</span>
          </button>
          <button
            onClick={() => setLocation("/profile/edit")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
            data-testid="nav-profile"
          >
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Edit Pregame Modal */}
      {showEditModal && editingPregame && (
        <SchedulePregameModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPregame(null);
          }}
          participantName={editingPregame.participantName}
          participantImage={editingPregame.participantImage}
          onSchedule={handleUpdatePregame}
          initialValues={{
            date: editingPregame.date,
            time: editingPregame.time,
            location: editingPregame.location,
            notes: editingPregame.notes
          }}
        />
      )}
    </div>
  );
}