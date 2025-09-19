import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import DiscoverFeed from "@/components/DiscoverFeed";
import MessageList from "@/components/MessageList";
import UserProfile from "@/components/UserProfile";
import RatingModal from "@/components/RatingModal";
import Navigation from "@/components/Navigation";
import NotFound from "@/pages/not-found";

// TODO: Remove mock data functionality when implementing backend
const mockUsers = [
  {
    id: "1",
    name: "Alex Johnson",
    age: 24,
    description: "Love meeting new people and exploring the city's nightlife scene. Always down for a fun pregame with good vibes!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    groupSizeMin: 4,
    groupSizeMax: 8,
    preferredAlcohol: "Cocktails",
    availability: "Weekends",
    rating: 4.7,
    reviewCount: 23,
    city: "Austin"
  },
  {
    id: "2",
    name: "Sarah Chen",
    age: 26,
    description: "Party photographer and social butterfly! I bring the energy and good music recommendations to every gathering.",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    groupSizeMin: 3,
    groupSizeMax: 6,
    preferredAlcohol: "Wine",
    availability: "Friday nights",
    rating: 4.9,
    reviewCount: 41,
    city: "Austin"
  },
  {
    id: "3",
    name: "Mike Rodriguez",
    age: 22,
    description: "College student who knows all the best spots in town. Let's make some unforgettable memories together!",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    groupSizeMin: 5,
    groupSizeMax: 10,
    preferredAlcohol: "Beer",
    availability: "Most nights",
    rating: 4.5,
    reviewCount: 18,
    city: "Austin"
  },
  {
    id: "4",
    name: "Emma Wilson",
    age: 25,
    description: "Marketing professional who loves trying new cocktail bars and meeting creative people in the city.",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    groupSizeMin: 2,
    groupSizeMax: 5,
    preferredAlcohol: "Wine & Cocktails",
    availability: "Thu-Sat",
    rating: 4.8,
    reviewCount: 32,
    city: "Austin"
  }
];

// TODO: Remove mock conversations when implementing backend
const mockConversations = [
  {
    id: "1",
    participantName: "Sarah Chen",
    participantImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Sounds great! What time should we meet up?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    unreadCount: 2,
    hasUnreadPendingRating: false
  },
  {
    id: "2", 
    participantName: "Mike Rodriguez",
    participantImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Thanks for the great pregame last night!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 12),
    unreadCount: 0,
    hasUnreadPendingRating: true
  }
];

// TODO: Remove mock reviews when implementing backend
const mockReviews = [
  {
    id: "1",
    rating: 5,
    comment: "Amazing energy and super fun to hang out with! Made our pregame unforgettable.",
    reviewerName: "Sarah Chen",
    date: "2 weeks ago"
  },
  {
    id: "2", 
    rating: 4,
    comment: "Great vibes, showed up on time and brought good music recommendations.",
    reviewerName: "Mike Rodriguez",
    date: "1 month ago"
  }
];

function Router() {
  const [activeTab, setActiveTab] = useState<'discover' | 'messages' | 'profile'>('discover');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingRatingUser, setPendingRatingUser] = useState<{name: string, image?: string} | null>(null);

  // TODO: Replace with real data from backend
  const pendingRatingsCount = mockConversations.filter(c => c.hasUnreadPendingRating).length;
  const messageCount = mockConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleViewProfile = (userId: string) => {
    console.log('Viewing profile:', userId);
    setSelectedUser(userId);
  };

  const handleMessage = (userId: string) => {
    console.log('Starting message with user:', userId);
    setActiveTab('messages');
  };

  const handleBackToFeed = () => {
    setSelectedUser(null);
  };

  const handleRefreshFeed = () => {
    console.log('Refreshing discover feed...');
  };

  const handleConversationClick = (conversationId: string) => {
    console.log('Opening conversation:', conversationId);
    // TODO: Implement conversation view
  };

  const handleSubmitRating = (rating: number, comment: string) => {
    console.log('Rating submitted:', { rating, comment, user: pendingRatingUser });
    setShowRatingModal(false);
    setPendingRatingUser(null);
  };

  // Demo function to show rating modal
  const showRatingDemo = () => {
    setPendingRatingUser({
      name: "Mike Rodriguez",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    });
    setShowRatingModal(true);
  };

  if (selectedUser) {
    const user = mockUsers.find(u => u.id === selectedUser);
    if (user) {
      return (
        <UserProfile
          {...user}
          reviews={mockReviews}
          onMessage={handleMessage}
          onBack={handleBackToFeed}
        />
      );
    }
  }

  return (
    <Switch>
      <Route path="/">
        <div className="min-h-screen bg-background pb-20">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                PreGame Connect
              </h1>
              <div className="flex items-center gap-2">
                {pendingRatingsCount > 0 && (
                  <button
                    onClick={showRatingDemo}
                    className="text-sm bg-destructive text-destructive-foreground px-3 py-1 rounded-full hover-elevate"
                    data-testid="button-rating-demo"
                  >
                    Rate Experience
                  </button>
                )}
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto p-4">
            {activeTab === 'discover' && (
              <DiscoverFeed
                users={mockUsers}
                onViewProfile={handleViewProfile}
                onMessage={handleMessage}
                onRefresh={handleRefreshFeed}
              />
            )}
            
            {activeTab === 'messages' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Messages</h2>
                <MessageList
                  conversations={mockConversations}
                  onConversationClick={handleConversationClick}
                />
              </div>
            )}
            
            {activeTab === 'profile' && (
              <UserProfile
                {...mockUsers[0]}
                reviews={mockReviews}
                onMessage={handleMessage}
                onBack={handleBackToFeed}
                isOwnProfile={true}
              />
            )}
          </main>

          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            messageCount={messageCount}
            pendingRatingsCount={pendingRatingsCount}
          />

          {showRatingModal && pendingRatingUser && (
            <RatingModal
              isOpen={showRatingModal}
              onClose={() => setShowRatingModal(false)}
              userName={pendingRatingUser.name}
              userImage={pendingRatingUser.image}
              onSubmitRating={handleSubmitRating}
            />
          )}
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pregame-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
