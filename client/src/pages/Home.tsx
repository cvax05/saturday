import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DiscoverFeed from "@/components/DiscoverFeed";
import ConnectModal from "@/components/ConnectModal";
import RatingModal from "@/components/RatingModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Settings, Loader2, Users } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { authQueryFn } from "@/lib/queryClient";
import type { AuthResponse } from "@shared/schema";

// Mock data for now - will be replaced with actual API data later
const mockUsers = [
  {
    id: "1",
    name: "Alpha Sigma Beta",
    groupSize: 24,
    description: "Love meeting new people and exploring the city's nightlife scene. Always down for a fun pregame with good vibes!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    galleryImages: [
      "https://images.unsplash.com/photo-1574391884720-bbc139ec0bcc?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=300&fit=crop&crop=center"
    ],
    groupSizeMin: 4,
    groupSizeMax: 8,
    preferredAlcohol: "Cocktails",
    availability: "Weekends",
    rating: 4.7,
    reviewCount: 23,
    city: "Austin",
    school: "University of Texas at Austin"
  },
  {
    id: "2",
    name: "Delta Phi Sorority",
    groupSize: 32,
    description: "Party photographers and social butterflies! We bring the energy and good music recommendations to every gathering.",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=300&fit=crop&crop=center"
    ],
    groupSizeMin: 3,
    groupSizeMax: 6,
    preferredAlcohol: "Wine",
    availability: "Friday nights",
    rating: 4.9,
    reviewCount: 41,
    city: "Austin",
    school: "University of Texas at Austin"
  },
  {
    id: "3",
    name: "Theta Chi House",
    groupSize: 18,
    description: "College fraternity that knows all the best spots in town. Let's make some unforgettable memories together!",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    galleryImages: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1545987796-200677ee1011?w=300&h=300&fit=crop&crop=center"
    ],
    groupSizeMin: 5,
    groupSizeMax: 10,
    preferredAlcohol: "Beer",
    availability: "Most nights",
    rating: 4.5,
    reviewCount: 18,
    city: "Austin",
    school: "University of Texas at Austin"
  },
  {
    id: "4",
    name: "Marketing Club",
    groupSize: 12,
    description: "Marketing professionals who love trying new cocktail bars and meeting creative people in the city.",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    galleryImages: [],
    groupSizeMin: 2,
    groupSizeMax: 5,
    preferredAlcohol: "Wine & Cocktails",
    availability: "Thu-Sat",
    rating: 4.8,
    reviewCount: 32,
    city: "Austin",
    school: "University of Texas at Austin"
  }
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectUser, setConnectUser] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingUser, setRatingUser] = useState<{name: string, image?: string} | null>(null);

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;
  const currentUserSchool = currentUser?.school || "Your School";
  
  // Filter users by school (will be replaced by API call later)
  const schoolUsers = mockUsers.filter(user => user.school === currentUserSchool);

  const handleViewProfile = (userId: string) => {
    console.log('Viewing profile:', userId);
    setLocation(`/profile/${userId}`);
  };

  const handleMessage = (userId: string) => {
    console.log('Starting message with user:', userId);
    setLocation("/messages");
  };

  const handleConnect = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setConnectUser(user);
      setShowConnectModal(true);
    }
  };

  const handleConfirmConnect = () => {
    console.log('Confirmed pregame connection');
    // TODO: Create connection record in backend
    // Show rating modal as optional popup after connecting
    if (connectUser) {
      setRatingUser({
        name: connectUser.name,
        image: connectUser.profileImage
      });
      setShowRatingModal(true);
    }
    setLocation("/messages");
  };

  const handleSubmitRating = (rating: number, comment: string) => {
    console.log('Rating submitted:', { rating, comment });
    // TODO: Submit rating to backend
    setShowRatingModal(false);
    setRatingUser(null);
  };

  const handleRefreshFeed = () => {
    console.log('Refreshing discover feed...');
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome to {SITE_NAME}</h2>
            <p className="text-muted-foreground mb-4">
              Connect with your school community for pregame activities.
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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {SITE_NAME}
            </h1>
            <p className="text-sm text-muted-foreground">{currentUserSchool}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/profile/edit")}
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <DiscoverFeed
          users={schoolUsers}
          onViewProfile={handleViewProfile}
          onMessage={handleMessage}
          onRefresh={handleRefreshFeed}
        />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setLocation("/home")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-primary bg-primary/10"
            data-testid="nav-home"
          >
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setLocation("/messages")}
            className="flex flex-col items-center py-2 px-4 rounded-lg hover-elevate"
            data-testid="nav-messages"
          >
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            onClick={() => setLocation("/calendar")}
            className="flex flex-col items-center py-2 px-4 rounded-lg hover-elevate"
            data-testid="nav-calendar"
          >
            <span className="text-xs font-medium">Calendar</span>
          </button>
          <button
            onClick={() => setLocation("/groups")}
            className="flex flex-col items-center py-2 px-4 rounded-lg hover-elevate"
            data-testid="nav-groups"
          >
            <span className="text-xs font-medium">Groups</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        user={connectUser}
        onConfirm={handleConfirmConnect}
      />
      
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        user={ratingUser}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}