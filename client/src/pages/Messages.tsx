import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MessageList from "@/components/MessageList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

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

  // Fetch all messages for current user
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['/api/messages', currentUserEmail],
    enabled: !!currentUserEmail,
  });

  // Process messages into conversation summaries
  useEffect(() => {
    const processMessages = async () => {
      if (!messagesData || !currentUserEmail) return;
      
      // Handle different possible response structures
      const messages = (messagesData as any)?.messages || messagesData || [];
      if (!Array.isArray(messages)) return;

      const conversationMap = new Map<string, ConversationSummary>();
      
      // Group messages by conversation partner
      for (const message of messages) {
        const partnerEmail = message.senderEmail === currentUserEmail 
          ? message.recipientEmail 
          : message.senderEmail;
        
        const existing = conversationMap.get(partnerEmail);
        const messageTime = new Date(message.createdAt);
        
        if (!existing || messageTime > existing.lastMessageTime) {
          // Get user data for this partner - check both users and organizations
          const allUsersData = localStorage.getItem('allUsers');
          const allOrganizationsData = localStorage.getItem('allOrganizations');
          
          let partner = null;
          let partnerName = 'Unknown';
          let partnerImage = undefined;
          
          // First check in users
          if (allUsersData) {
            const allUsers = JSON.parse(allUsersData);
            partner = allUsers.find((user: any) => user.email === partnerEmail);
          }
          
          // If not found in users, check in organizations
          if (!partner && allOrganizationsData) {
            const allOrganizations = JSON.parse(allOrganizationsData);
            partner = allOrganizations.find((org: any) => org.contactEmail === partnerEmail);
          }
          
          if (partner) {
            partnerName = partner.name || partner.username || 'Unknown';
            partnerImage = partner.profileImage || partner.profileImages?.[0];
          } else {
            // If not found in localStorage, try fetching from API
            console.log('Messages: Partner not found in localStorage, fetching from API:', partnerEmail);
            try {
              const userResponse = await fetch(`/api/users/email/${encodeURIComponent(partnerEmail)}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                partnerName = userData.user.username || userData.user.name || 'Unknown';
                partnerImage = userData.user.profileImage || userData.user.profileImages?.[0];
                console.log('Messages: Found user via API:', partnerName);
              } else {
                // Try organizations API
                const orgResponse = await fetch(`/api/organizations/email/${encodeURIComponent(partnerEmail)}`);
                if (orgResponse.ok) {
                  const orgData = await orgResponse.json();
                  partnerName = orgData.organization.name || 'Unknown Organization';
                  partnerImage = orgData.organization.profileImage;
                  console.log('Messages: Found organization via API:', partnerName);
                } else {
                  // Create a better fallback name
                  partnerName = partnerEmail.includes('@') ? 
                    partnerEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : 
                    'Unknown User';
                  console.log('Messages: Using fallback name:', partnerName);
                }
              }
            } catch (error) {
              console.error('Messages: Error fetching partner data:', error);
              partnerName = partnerEmail.includes('@') ? 
                partnerEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : 
                'Unknown User';
            }
          }

          conversationMap.set(partnerEmail, {
            id: partnerEmail, // Use email as conversation ID
            participantName: partnerName,
            participantEmail: partnerEmail,
            participantImage: partnerImage,
            lastMessage: message.content,
            lastMessageTime: messageTime,
            unreadCount: existing?.unreadCount || 0,
            hasUnreadPendingRating: false
          });
        }
      }

      // Calculate unread counts
      conversationMap.forEach((conversation, partnerEmail) => {
        const unreadCount = messages.filter((msg: any) => 
          msg.senderEmail === partnerEmail && 
          msg.recipientEmail === currentUserEmail && 
          msg.isRead === 0
        ).length;
        conversation.unreadCount = unreadCount;
      });

      // Convert to array and sort by last message time
      const conversationArray = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      
      setConversations(conversationArray);
    };

    processMessages();
  }, [messagesData, currentUserEmail]);

  const handleConversationClick = (conversationId: string) => {
    setLocation(`/messages/${conversationId}`);
  };

  const handleBack = () => {
    setLocation("/groups");
  };

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
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading conversations...</div>
          </div>
        ) : conversations.length > 0 ? (
          <MessageList
            conversations={conversations}
            onConversationClick={handleConversationClick}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No messages yet</div>
            <div className="text-sm text-muted-foreground mt-2">
              Start chatting with groups from your school!
            </div>
            <Button 
              onClick={() => setLocation("/groups")} 
              className="mt-4"
              data-testid="button-browse-groups"
            >
              Browse Groups
            </Button>
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
            className="flex flex-col items-center py-2 px-4 rounded-lg text-primary bg-primary/10"
            data-testid="nav-messages"
          >
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            onClick={() => setLocation("/calendar")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
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
    </div>
  );
}