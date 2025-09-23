import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
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
  id: string;
  name: string;
  image?: string;
}

// TODO: Remove mock data when implementing backend
const mockConversations = {
  "1": {
    participant: {
      id: "2",
      name: "Delta Phi Sorority",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    messages: [
      {
        id: "1",
        content: "Hey! I saw your group profile and would love to coordinate a pregame before the basketball game this Friday!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isFromUser: false,
        senderName: "Delta Phi Sorority"
      },
      {
        id: "2", 
        content: "That sounds amazing! We're definitely interested. What time were you thinking?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        isFromUser: true,
        senderName: "Your Group"
      },
      {
        id: "3",
        content: "Perfect! How about 6 PM at our house? We can provide the space and some drinks if you guys want to bring snacks and music?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isFromUser: false,
        senderName: "Delta Phi Sorority"
      }
    ]
  },
  "2": {
    participant: {
      id: "3",
      name: "Theta Chi House",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    messages: [
      {
        id: "4",
        content: "Thanks for the great pregame last night! Your group knows how to party 🎉",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
        isFromUser: false,
        senderName: "Theta Chi House"
      },
      {
        id: "5",
        content: "Had such a blast! You guys are awesome. Let's definitely do it again soon!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 11),
        isFromUser: true,
        senderName: "Your Group"
      }
    ]
  },
  "3": {
    participant: {
      id: "4", 
      name: "Marketing Club",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    messages: [
      {
        id: "6",
        content: "Hey! I saw your profile and would love to connect. Are you free this weekend for a pregame?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        isFromUser: false,
        senderName: "Marketing Club"
      }
    ]
  }
};

export default function ChatView() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participant, setParticipant] = useState<ChatUser | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversationId = params.id;

  useEffect(() => {
    // Load conversation data
    if (conversationId && mockConversations[conversationId as keyof typeof mockConversations]) {
      const conversation = mockConversations[conversationId as keyof typeof mockConversations];
      setParticipant(conversation.participant);
      
      // Load stored messages from localStorage and merge with mock data
      const storedMessages = localStorage.getItem(`conversation_${conversationId}`);
      let allMessages = [...conversation.messages];
      
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          // Convert timestamp strings back to Date objects
          const processedMessages = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          allMessages = [...conversation.messages, ...processedMessages];
        } catch (e) {
          console.error('Error loading stored messages:', e);
        }
      }
      
      setMessages(allMessages);
    }
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !participant) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date(),
      isFromUser: true,
      senderName: "Your Group"
    };

    setMessages(prev => {
      const newMessages = [...prev, message];
      
      // Save new messages to localStorage (only user's messages to avoid duplicating mock data)
      const userMessages = newMessages.filter(msg => msg.isFromUser);
      const mockMessages = mockConversations[conversationId as keyof typeof mockConversations]?.messages || [];
      const userOnlyMessages = userMessages.filter(msg => 
        !mockMessages.find(mockMsg => mockMsg.id === msg.id)
      );
      
      localStorage.setItem(`conversation_${conversationId}`, JSON.stringify(userOnlyMessages));
      
      return newMessages;
    });
    
    setNewMessage("");

    // TODO: Send message to backend
    console.log('Sending message:', message);
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

  const handleSchedulePregame = (scheduleData: {
    date: string;
    time: string;
    location?: string;
    notes?: string;
  }) => {
    if (!participant) return;

    // Create scheduled pregame object
    const scheduledPregame = {
      id: Date.now().toString(),
      participantId: participant.id,
      participantName: participant.name,
      participantImage: participant.image,
      date: scheduleData.date,
      time: scheduleData.time,
      location: scheduleData.location || "",
      notes: scheduleData.notes || "",
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const existingPregames = localStorage.getItem('scheduledPregames');
    let pregames = [];
    
    if (existingPregames) {
      try {
        pregames = JSON.parse(existingPregames);
      } catch (e) {
        console.error('Error loading existing pregames:', e);
      }
    }

    pregames.push(scheduledPregame);
    localStorage.setItem('scheduledPregames', JSON.stringify(pregames));

    console.log('Scheduled pregame:', scheduledPregame);
    
    // Add confirmation message to chat
    const confirmationMessage: Message = {
      id: Date.now().toString() + "_system",
      content: `Pregame scheduled for ${scheduleData.date} at ${scheduleData.time}${scheduleData.location ? ` at ${scheduleData.location}` : ''}`,
      timestamp: new Date(),
      isFromUser: true,
      senderName: "System"
    };

    setMessages(prev => [...prev, confirmationMessage]);
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
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm leading-relaxed" data-testid={`message-${message.id}`}>
                      {message.content}
                    </p>
                  </Card>
                  <p className={`text-xs text-muted-foreground mt-1 ${
                    message.isFromUser ? 'text-right' : 'text-left'
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