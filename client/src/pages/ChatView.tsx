import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import SchedulePregameModal from "@/components/SchedulePregameModal";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isFromUser: boolean;
  senderName: string;
}

interface ChatUser {
  email: string;
  name: string;
  image?: string;
  isOrganization?: boolean;
}

export default function ChatView() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participant, setParticipant] = useState<ChatUser | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const partnerEmail = params.id; // Using email as conversation ID

  // Get current user email
  useEffect(() => {
    try {
      const currentUserData = localStorage.getItem('currentUser');
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData);
        setCurrentUserEmail(currentUser.email || "");
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  }, []);

  // Fetch conversation messages between current user and partner
  const { data: conversationData, isLoading } = useQuery({
    queryKey: ['/api/messages/conversation', currentUserEmail, partnerEmail],
    enabled: !!currentUserEmail && !!partnerEmail,
  });

  // Set up participant data and process messages
  useEffect(() => {
    if (!partnerEmail || !currentUserEmail) return;

    console.log('ChatView: Setting up participant for', partnerEmail);

    // Check if this is a self-conversation
    if (partnerEmail === currentUserEmail) {
      console.log('ChatView: Self-conversation detected');
      const currentUserData = localStorage.getItem('currentUser');
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData);
        setParticipant({
          email: currentUser.email,
          name: currentUser.name || currentUser.username || 'You',
          image: currentUser.profileImage || currentUser.profileImages?.[0]
        });
      }
      return;
    }

    const findPartnerData = async () => {
      // Get partner user data from localStorage - check both users and organizations
      const allUsersData = localStorage.getItem('allUsers');
      const allOrganizationsData = localStorage.getItem('allOrganizations');
      
      let partner = null;
      let isOrganization = false;
      
      // First check in users
      if (allUsersData) {
        const allUsers = JSON.parse(allUsersData);
        partner = allUsers.find((user: any) => user.email === partnerEmail);
      }
      
      // If not found in users, check in organizations
      if (!partner && allOrganizationsData) {
        const allOrganizations = JSON.parse(allOrganizationsData);
        partner = allOrganizations.find((org: any) => org.contactEmail === partnerEmail);
        isOrganization = !!partner;
      }
      
      console.log('ChatView: Found partner in localStorage:', !!partner, 'isOrganization:', isOrganization);
      
      // If not found in localStorage, try fetching from API
      if (!partner) {
        console.log('ChatView: Partner not found in localStorage, fetching from API');
        try {
          // Try to fetch as user first
          const userResponse = await fetch(`/api/users/email/${encodeURIComponent(partnerEmail)}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            partner = userData.user;
            isOrganization = false;
            console.log('ChatView: Found partner via user API:', partner.name);
          } else {
            // If not found as user, try as organization
            const orgResponse = await fetch(`/api/organizations/email/${encodeURIComponent(partnerEmail)}`);
            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              partner = orgData.organization;
              isOrganization = true;
              console.log('ChatView: Found partner via organization API:', partner.name);
            } else {
              console.log('ChatView: Partner not found via any API, using fallback');
            }
          }
        } catch (error) {
          console.error('ChatView: Error fetching partner data:', error);
        }
      }
      
      if (partner) {
        setParticipant({
          email: partnerEmail,
          name: partner.name || partner.username || 'Unknown',
          image: partner.profileImage || partner.profileImages?.[0],
          isOrganization
        });
      } else {
        // Create a fallback participant with a better default name
        console.log('ChatView: Using fallback participant name');
        const fallbackName = partnerEmail.includes('@') ? 
          partnerEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : 
          'Unknown User';
        
        setParticipant({
          email: partnerEmail,
          name: fallbackName,
          image: undefined,
          isOrganization: false
        });
      }
    };

    findPartnerData();
  }, [partnerEmail, currentUserEmail]);

  // Process messages in a separate useEffect
  useEffect(() => {
    if (!conversationData || !currentUserEmail) return;
    
    // Handle different possible response structures
    const messages = (conversationData as any)?.messages || conversationData || [];
    if (Array.isArray(messages)) {
      const processedMessages: Message[] = messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        isFromUser: msg.senderEmail === currentUserEmail,
        senderName: msg.senderEmail === currentUserEmail ? "You" : (participant?.name || "Partner")
      })).sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(processedMessages);
    }
  }, [conversationData, currentUserEmail, participant?.name]);

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { recipientEmail: string; content: string; senderEmail: string }) => {
      return apiRequest('POST', `/api/messages/send`, messageData);
    },
    onSuccess: () => {
      // Refetch the conversation to get the updated messages
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages/conversation', currentUserEmail, partnerEmail]
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/messages', currentUserEmail]
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    },
  });

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !partnerEmail || !currentUserEmail) return;

    // Send message via API
    sendMessageMutation.mutate({
      recipientEmail: partnerEmail,
      content: newMessage.trim(),
      senderEmail: currentUserEmail
    });
    
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    setLocation("/messages");
  };

  const schedulePregameMutation = useMutation({
    mutationFn: async (scheduleData: {
      date: string;
      time: string;
      location?: string;
      notes?: string;
    }) => {
      if (!participant || !currentUserEmail) throw new Error("Missing participant or current user");
      
      return apiRequest('POST', `/api/pregames`, {
        creatorEmail: currentUserEmail,
        participantEmail: participant.email,
        date: scheduleData.date,
        time: scheduleData.time,
        location: scheduleData.location || "",
        notes: scheduleData.notes || ""
      });
    },
    onSuccess: (data, variables) => {
      console.log('Pregame scheduled successfully:', data);
      
      // Invalidate calendar queries to refresh pregame list
      queryClient.invalidateQueries({ queryKey: ['/api/pregames', currentUserEmail] });
      
      // Add confirmation message to chat
      const confirmationMessage: Message = {
        id: Date.now().toString() + "_system",
        content: `Pregame scheduled for ${variables.date} at ${variables.time}${variables.location ? ` at ${variables.location}` : ''}`,
        timestamp: new Date(),
        isFromUser: true,
        senderName: "System"
      };

      setMessages(prev => [...prev, confirmationMessage]);
    },
    onError: (error) => {
      console.error('Error scheduling pregame:', error);
      // Could add error message to chat or show toast
    }
  });

  const handleSchedulePregame = (scheduleData: {
    date: string;
    time: string;
    location?: string;
    notes?: string;
  }) => {
    schedulePregameMutation.mutate(scheduleData);
  };

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Conversation not found</h2>
          <Button onClick={handleBack}>Back to Messages</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={participant.image} alt={participant.name} />
            <AvatarFallback>
              {participant.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="font-semibold text-lg" data-testid="text-participant-name">
              {participant.name}
            </h1>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>

          {!participant.isOrganization && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScheduleModal(true)}
              className="gap-2"
              data-testid="button-schedule-pregame"
            >
              <Calendar className="h-4 w-4" />
              Schedule Pregame
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.isFromUser ? 'order-2' : 'order-1'}`}>
                  <Card className={`p-3 ${
                    message.isFromUser 
                      ? 'bg-purple-600 text-white ml-auto' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm leading-relaxed" data-testid={`message-${message.id}`}>
                      {message.content}
                    </p>
                  </Card>
                  <p className={`text-xs mt-1 ${
                    message.isFromUser ? 'text-white/70 text-right' : 'text-muted-foreground text-left'
                  }`}>
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t bg-background p-4">
            <div className="flex gap-2 items-end">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${participant.name}...`}
                className="flex-1"
                data-testid="input-message"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="icon"
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Schedule Pregame Modal */}
      {showScheduleModal && participant && (
        <SchedulePregameModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          participantName={participant.name}
          participantImage={participant.image}
          onSchedule={handleSchedulePregame}
        />
      )}
    </div>
  );
}