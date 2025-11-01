import { useLocation } from "wouter";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, MessageCircle, Send, Calendar } from "lucide-react";
import { authQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import type { AuthResponse } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ConversationUser {
  id: string;
  displayName: string | null;
  username: string;
  profileImage: string | null;
}

interface Conversation {
  id: string;
  title: string | null;
  isGroup: boolean;
  lastMessageAt: string | null;
  otherParticipants: ConversationUser[];
  unreadCount: number;
}

// Helper function to convert Date to local YYYY-MM-DD string (timezone-safe)
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to generate next N Saturdays
const getNextSaturdays = (count: number = 10): { date: Date; isoString: string; displayText: string }[] => {
  const saturdays: { date: Date; isoString: string; displayText: string }[] = [];
  const today = new Date();
  let current = new Date(today);
  
  // Find the next Saturday
  const daysUntilSaturday = (6 - current.getDay() + 7) % 7;
  if (daysUntilSaturday === 0 && current.getHours() >= 12) {
    // If it's Saturday afternoon, start from next Saturday
    current.setDate(current.getDate() + 7);
  } else {
    current.setDate(current.getDate() + daysUntilSaturday);
  }
  
  // Generate the next saturdays
  for (let i = 0; i < count; i++) {
    const saturdayDate = new Date(current);
    // Use timezone-safe local date formatting instead of toISOString()
    const isoString = formatDateToLocal(saturdayDate);
    
    // Format display text (e.g., "Sat, Nov 2" or "This Saturday" for the first one)
    const displayText = saturdayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    saturdays.push({
      date: saturdayDate,
      isoString,
      displayText: i === 0 ? `This Saturday (${displayText})` : displayText
    });
    
    current.setDate(current.getDate() + 7);
  }
  
  return saturdays;
};

export default function Messages() {
  const [, setLocation] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const justSentRef = useRef(false);
  const lastMarkedMessageId = useRef<string | null>(null);
  const lastMarkReadTime = useRef(0);
  const prevScrollHeightRef = useRef(0);
  
  // Get upcoming Saturdays for pregame scheduling
  const upcomingSaturdays = getNextSaturdays(10);
  
  // Schedule pregame dialog state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [pregameForm, setPregameForm] = useState({
    date: upcomingSaturdays[0]?.isoString || "",
    time: "",
    location: "",
    notes: ""
  });

  // Get current user
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;

  // Fetch all conversations with real-time updates
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: !!currentUser,
    refetchInterval: 3000, // Poll every 3 seconds for new conversations and unread counts
  });

  const conversations = (conversationsData as any)?.conversations || [];

  // Fetch messages for selected conversation with infinite scroll
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/messages', selectedConversationId],
    enabled: !!selectedConversationId,
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/messages/${selectedConversationId}?cursor=${pageParam}&limit=30`
        : `/api/messages/${selectedConversationId}?limit=30`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage?.nextCursor || undefined;
    },
    initialPageParam: undefined,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Messages sorted by createdAt ascending (oldest first) with de-duplication
  const messages = (() => {
    const allMessages = messagesData?.pages.flatMap((page: any) => page.messages || []) || [];
    const messageMap = new Map<string, Message>();
    
    // De-duplicate by message ID
    allMessages.forEach((msg: Message) => {
      if (!messageMap.has(msg.id)) {
        messageMap.set(msg.id, msg);
      }
    });
    
    return Array.from(messageMap.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  })();

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId) throw new Error("No conversation selected");
      return apiRequest("POST", `/api/messages/${selectedConversationId}`, { content });
    },
    onSuccess: () => {
      justSentRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      setMessageText("");
    },
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("POST", `/api/messages/${conversationId}/read`, { 
        lastReadAt: new Date().toISOString() 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
  });

  // Fetch pregames for conversation
  const { data: pregamesData } = useQuery({
    queryKey: ['/api/conversations', selectedConversationId, 'pregames'],
    enabled: !!selectedConversationId,
    refetchInterval: 5000, // Poll every 5 seconds for new pregames
  });

  const pregames = (pregamesData as any)?.pregames || [];

  // Schedule pregame mutation
  const schedulePregameMutation = useMutation({
    mutationFn: async (formData: typeof pregameForm) => {
      if (!selectedConversationId) throw new Error("No conversation selected");
      return apiRequest("POST", `/api/conversations/${selectedConversationId}/pregames`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversationId, 'pregames'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pregames/calendar'] });
      setShowScheduleDialog(false);
      // Reset form with freshly computed first upcoming Saturday
      const freshSaturdays = getNextSaturdays(10);
      setPregameForm({ 
        date: freshSaturdays[0]?.isoString || "", 
        time: "", 
        location: "", 
        notes: "" 
      });
    },
  });

  // Reset state when conversation changes
  useEffect(() => {
    setIsNearBottom(true);
    justSentRef.current = false;
    lastMarkedMessageId.current = null;
    prevScrollHeightRef.current = 0;
  }, [selectedConversationId]);

  // Reset pregame form to first upcoming Saturday when dialog opens
  useEffect(() => {
    if (showScheduleDialog) {
      const saturdays = getNextSaturdays(10);
      setPregameForm(prev => ({
        ...prev,
        date: saturdays[0]?.isoString || ""
      }));
    }
  }, [showScheduleDialog]);

  // Check if user is near bottom of scroll area
  const checkIfNearBottom = () => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsNearBottom(nearBottom);
    }
  };

  // Preserve scroll position when loading older messages, auto-scroll when near bottom or just sent
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const currentScrollHeight = viewport.scrollHeight;
    const prevScrollHeight = prevScrollHeightRef.current;

    // If scroll height increased and we have a previous value, we loaded older messages
    if (prevScrollHeight > 0 && currentScrollHeight > prevScrollHeight) {
      // Preserve scroll position by adjusting for the height increase
      requestAnimationFrame(() => {
        if (viewport) {
          viewport.scrollTop += (currentScrollHeight - prevScrollHeight);
        }
      });
    } else {
      // Normal auto-scroll behavior when near bottom or just sent
      const shouldScroll = isNearBottom || justSentRef.current;
      
      if (shouldScroll) {
        viewport.scrollTop = viewport.scrollHeight;
        justSentRef.current = false;
      }
    }

    // Update previous scroll height
    prevScrollHeightRef.current = currentScrollHeight;
  }, [messages, isNearBottom]);

  // Mark as read with throttling - only when new messages arrive and user is viewing
  useEffect(() => {
    if (!selectedConversationId || messages.length === 0 || !isNearBottom) {
      return;
    }

    const newestMessage = messages[messages.length - 1];
    const now = Date.now();
    const shouldMark = 
      lastMarkedMessageId.current !== newestMessage.id &&
      now - lastMarkReadTime.current > 5000; // Throttle to max once per 5 seconds

    if (shouldMark) {
      lastMarkedMessageId.current = newestMessage.id;
      lastMarkReadTime.current = now;
      markReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId, messages, isNearBottom]);

  const handleSendMessage = () => {
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find((c: Conversation) => c.id === selectedConversationId);
  
  const getConversationDisplayName = (conv: Conversation) => {
    if (conv.title) return conv.title;
    if (!conv.otherParticipants || conv.otherParticipants.length === 0) return "Unknown";
    if (conv.otherParticipants.length === 1) {
      const user = conv.otherParticipants[0];
      return user.displayName || user.username;
    }
    return conv.otherParticipants.map(u => u.displayName || u.username).join(", ");
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.otherParticipants && conv.otherParticipants.length > 0) {
      const participant = conv.otherParticipants[0];
      return participant.profileImage || undefined;
    }
    return undefined;
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to view your messages.
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Show back button on mobile when viewing a conversation */}
            {selectedConversationId ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversationId(null)}
                data-testid="button-back-conversations"
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/groups')}
                data-testid="button-back-home"
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold" data-testid="messages-title">
                {selectedConversationId && selectedConversation ? (
                  <span className="md:hidden">{getConversationDisplayName(selectedConversation)}</span>
                ) : null}
                <span className={selectedConversationId ? "hidden md:inline" : ""}>Messages</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentUser?.school || "Your School"}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Main 2-pane layout - single pane on mobile */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Conversation list - hidden on mobile when conversation is selected */}
        <div className={`w-full md:w-80 md:border-r flex flex-col ${selectedConversationId ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv: Conversation) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    data-testid={`conversation-item-${conv.id}`}
                    className={`w-full p-4 text-left hover-elevate ${
                      selectedConversationId === conv.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getConversationAvatar(conv)} />
                        <AvatarFallback>
                          {getConversationDisplayName(conv).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">
                            {getConversationDisplayName(conv)}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessageAt && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right pane: Message thread - full width on mobile when conversation is selected */}
        <div className={`flex-1 flex flex-col ${!selectedConversationId ? 'hidden md:flex' : ''}`}>
          {selectedConversationId && selectedConversation ? (
            <>
              {/* Conversation header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getConversationAvatar(selectedConversation)} />
                      <AvatarFallback>
                        {getConversationDisplayName(selectedConversation).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold" data-testid="conversation-header-name">
                        {getConversationDisplayName(selectedConversation)}
                      </h3>
                      {!!selectedConversation.isGroup && selectedConversation.otherParticipants && (
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.otherParticipants.length + 1} members
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-schedule-pregame">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Pregame
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Pregame</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="saturday">Saturday</Label>
                          <Select 
                            value={pregameForm.date} 
                            onValueChange={(value) => setPregameForm({ ...pregameForm, date: value })}
                          >
                            <SelectTrigger 
                              id="saturday" 
                              className="w-full" 
                              data-testid="select-pregame-saturday"
                            >
                              <SelectValue placeholder="Select a Saturday" />
                            </SelectTrigger>
                            <SelectContent>
                              {upcomingSaturdays.map((saturday) => (
                                <SelectItem 
                                  key={saturday.isoString} 
                                  value={saturday.isoString}
                                  data-testid={`option-saturday-${saturday.isoString}`}
                                >
                                  {saturday.displayText}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={pregameForm.time}
                            onChange={(e) => setPregameForm({ ...pregameForm, time: e.target.value })}
                            data-testid="input-pregame-time"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            type="text"
                            placeholder="Enter location"
                            value={pregameForm.location}
                            onChange={(e) => setPregameForm({ ...pregameForm, location: e.target.value })}
                            data-testid="input-pregame-location"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any additional details..."
                            value={pregameForm.notes}
                            onChange={(e) => setPregameForm({ ...pregameForm, notes: e.target.value })}
                            data-testid="input-pregame-notes"
                          />
                        </div>
                        <Button 
                          onClick={() => schedulePregameMutation.mutate(pregameForm)}
                          disabled={!pregameForm.date || !pregameForm.time || !pregameForm.location || schedulePregameMutation.isPending}
                          className="w-full"
                          data-testid="button-submit-pregame"
                        >
                          {schedulePregameMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            "Schedule Pregame"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Scheduled Pregames */}
              {pregames.length > 0 && (
                <div className="p-4 border-b bg-muted/30">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Scheduled Pregames
                  </h4>
                  <div className="space-y-2">
                    {pregames.map((pregame: any) => (
                      <div key={pregame.id} className="bg-card border rounded-lg p-3" data-testid={`pregame-${pregame.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{pregame.location}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(pregame.date + 'T00:00:00'), 'MMM d, yyyy')} at {pregame.time}
                            </p>
                            {pregame.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{pregame.notes}</p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pregame.creatorId === currentUser?.id ? "You scheduled" : "Scheduled"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4" ref={scrollViewportRef} onScroll={checkIfNearBottom}>
                {hasNextPage && (
                  <div className="text-center py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      data-testid="button-load-more"
                    >
                      {isFetchingNextPage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Load more messages"
                      )}
                    </Button>
                  </div>
                )}
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg: Message) => {
                      const isOwn = msg.senderId === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${msg.id}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-purple-600 text-white'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message composer */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
