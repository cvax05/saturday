import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, User, Home } from "lucide-react";

interface NavigationProps {
  activeTab: 'discover' | 'messages' | 'profile';
  onTabChange: (tab: 'discover' | 'messages' | 'profile') => void;
  messageCount?: number;
  pendingRatingsCount?: number;
}

export default function Navigation({ 
  activeTab, 
  onTabChange, 
  messageCount = 0,
  pendingRatingsCount = 0 
}: NavigationProps) {
  const handleTabClick = (tab: 'discover' | 'messages' | 'profile') => {
    console.log(`Switching to ${tab} tab`);
    onTabChange(tab);
  };

  const isBlocked = pendingRatingsCount > 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        
        <button
          onClick={() => handleTabClick('discover')}
          disabled={isBlocked}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'discover' 
              ? 'text-primary bg-primary/10' 
              : isBlocked 
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="nav-discover"
        >
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Discover</span>
        </button>

        <button
          onClick={() => handleTabClick('messages')}
          disabled={isBlocked}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors relative ${
            activeTab === 'messages' 
              ? 'text-primary bg-primary/10' 
              : isBlocked 
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="nav-messages"
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5 mb-1" />
            {messageCount > 0 && !isBlocked && (
              <Badge className="absolute -top-2 -right-2 h-4 w-4 text-xs justify-center p-0 bg-primary">
                {messageCount > 9 ? '9+' : messageCount}
              </Badge>
            )}
          </div>
          <span className="text-xs font-medium">Messages</span>
        </button>

        <button
          onClick={() => handleTabClick('profile')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors relative ${
            activeTab === 'profile' 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="nav-profile"
        >
          <div className="relative">
            <User className="h-5 w-5 mb-1" />
            {pendingRatingsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 w-4 text-xs justify-center p-0 bg-destructive">
                {pendingRatingsCount > 9 ? '9+' : pendingRatingsCount}
              </Badge>
            )}
          </div>
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
      
      {isBlocked && (
        <div className="bg-destructive/10 border-t border-destructive/20 px-4 py-2">
          <p className="text-xs text-destructive text-center font-medium">
            Complete pending ratings to continue using the app
          </p>
        </div>
      )}
    </nav>
  );
}