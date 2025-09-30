import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MessageList from "@/components/MessageList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { authQueryFn } from "@/lib/queryClient";
import type { AuthResponse } from "@shared/schema";

interface ConversationSummary {
  id: string;
  participantName: string;
  participantEmail: string;
  participantImage?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  hasUnreadPendingRating: boolean;
}

export default function Messages() {
  const [, setLocation] = useLocation();

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;
  const currentUserEmail = currentUser?.email || "";

  // Fetch all messages for current user (JWT automatically provides school scoping)
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', currentUserEmail],
    enabled: !!currentUser?.email,
  });

  // Process messages into conversation summaries
  const conversations: ConversationSummary[] = (() => {
    if (!messagesData || !currentUserEmail) return [];
    
    // Handle different possible response structures
    const messages = (messagesData as any)?.messages || messagesData || [];
    if (!Array.isArray(messages)) return [];

    const conversationMap = new Map<string, ConversationSummary>();
    
    // Group messages by conversation partner
    for (const message of messages) {
      const partnerEmail = message.senderEmail === currentUserEmail 
        ? message.recipientEmail 
        : message.senderEmail;
      
      const existing = conversationMap.get(partnerEmail);
      const messageTime = new Date(message.createdAt);
      
      if (!existing || messageTime > existing.lastMessageTime) {
        // Create display name from email (simplified approach)
        const partnerName = partnerEmail.includes('@') 
          ? partnerEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
          : 'Unknown User';
        
        conversationMap.set(partnerEmail, {
          id: partnerEmail, // Using email as ID for now
          participantName: partnerName,
          participantEmail: partnerEmail,
          participantImage: undefined, // Will be enhanced later
          lastMessage: message.content || "",
          lastMessageTime: messageTime,
          unreadCount: existing?.unreadCount || 0,
          hasUnreadPendingRating: false
        });
      }
      
      // Update unread count (simplified logic)
      const conversation = conversationMap.get(partnerEmail);
      if (conversation && message.senderEmail !== currentUserEmail && !message.isRead) {
        conversation.unreadCount++;
      }
    }
    
    return Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
  })();

  const handleConversationClick = (conversationId: string) => {
    setLocation(`/messages/${conversationId}`);
  };

  const handleBackToHome = () => {
    setLocation('/');
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
    <div className="min-h-screen bg-background">
      {/* Header with back button and theme toggle */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              data-testid="button-back-home"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold" data-testid="messages-title">Messages</h1>
              <p className="text-sm text-muted-foreground">
                {currentUser?.school || "Your School"}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Messages content */}
      <main className="max-w-4xl mx-auto p-4">
        {messagesLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading your conversations...</p>
          </div>
        )}

        {!messagesLoading && (
          <MessageList 
            conversations={conversations} 
            onConversationClick={handleConversationClick}
          />
        )}
      </main>
    </div>
  );
}