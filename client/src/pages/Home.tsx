import { useState } from "react";
import { useLocation } from "wouter";
import DiscoverFeed from "@/components/DiscoverFeed";
import ConnectModal from "@/components/ConnectModal";
import RatingModal from "@/components/RatingModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, AlertTriangle } from "lucide-react";

// TODO: Remove mock data when implementing backend
const mockUsers = [
  {
    id: "1",
    name: "Alpha Sigma Beta",
    groupSize: 24,
    description: "Love meeting new people and exploring the city's nightlife scene. Always down for a fun pregame with good vibes!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
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
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectUser, setConnectUser] = useState<typeof mockUsers[0] | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingUser, setRatingUser] = useState<{name: string, image?: string} | null>(null);

  // TODO: Get current user's school from backend
  // For now, get from localStorage or use a default
  const getCurrentUserSchool = () => {
    // Try to get from localStorage if user has registered
    const storedFormData = localStorage.getItem('currentUser');
    if (storedFormData) {
      try {
        const userData = JSON.parse(storedFormData);
        return userData.school || "Your School";
      } catch (e) {
        return "Your School";
      }
    }
    return "Your School";
  };
  
  const currentUserSchool = getCurrentUserSchool();
  
  // Filter users by school
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              PreGame Connect
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
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
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

      {showConnectModal && connectUser && (
        <ConnectModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onConfirm={handleConfirmConnect}
          userName={connectUser.name}
          userImage={connectUser.profileImage}
          userGroupSize={connectUser.groupSize}
          groupSize={`${connectUser.groupSizeMin}-${connectUser.groupSizeMax}`}
          preferredAlcohol={connectUser.preferredAlcohol}
        />
      )}

      {showRatingModal && ratingUser && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          userName={ratingUser.name}
          userImage={ratingUser.image}
          onSubmitRating={handleSubmitRating}
        />
      )}
    </div>
  );
}