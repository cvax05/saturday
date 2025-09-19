import { useState } from "react";
import ProfileCard from "./ProfileCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface User {
  id: string;
  name: string;
  age: number;
  description: string;
  profileImage?: string;
  groupSizeMin: number;
  groupSizeMax: number;
  preferredAlcohol: string;
  availability: string;
  rating: number;
  reviewCount: number;
  city: string;
}

interface DiscoverFeedProps {
  users: User[];
  onViewProfile: (userId: string) => void;
  onMessage: (userId: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function DiscoverFeed({
  users,
  onViewProfile,
  onMessage,
  onRefresh,
  isLoading = false
}: DiscoverFeedProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('Refreshing discover feed...');
    onRefresh();
    
    // Simulate loading time
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="h-20 w-20 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-18"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-4xl">🎉</div>
        <h3 className="text-lg font-semibold mb-2">No one around right now</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Check back later or try refreshing to see if new people have joined
        </p>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Discover People</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="button-refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-4">
        {users.map((user) => (
          <ProfileCard
            key={user.id}
            {...user}
            onViewProfile={onViewProfile}
            onMessage={onMessage}
          />
        ))}
      </div>
      
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">
          You've seen all available profiles
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-2"
        >
          Load more people
        </Button>
      </div>
    </div>
  );
}