import { useState } from "react";
import { useLocation } from "wouter";
import MessageList from "@/components/MessageList";
import RatingModal from "@/components/RatingModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle } from "lucide-react";

// TODO: Remove mock conversations when implementing backend
const mockConversations = [
  {
    id: "1",
    participantName: "Sarah Chen",
    participantImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Sounds great! What time should we meet up?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    unreadCount: 2,
    hasUnreadPendingRating: false
  },
  {
    id: "2", 
    participantName: "Mike Rodriguez",
    participantImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Thanks for the great pregame last night!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    unreadCount: 0,
    hasUnreadPendingRating: true
  },
  {
    id: "3",
    participantName: "Emma Wilson", 
    participantImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Hey! I saw your profile and would love to connect",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    unreadCount: 1,
    hasUnreadPendingRating: false
  }
];

export default function Messages() {
  const [, setLocation] = useLocation();

  const handleConversationClick = (conversationId: string) => {
    console.log('Opening conversation:', conversationId);
    setLocation(`/messages/${conversationId}`);
  };

  const handleBack = () => {
    setLocation("/home");
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
        <MessageList
          conversations={mockConversations}
          onConversationClick={handleConversationClick}
        />
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