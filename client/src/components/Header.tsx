import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Users, MessageCircle } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

interface UserData {
  username: string;
  email: string;
  profileImages?: string[];
}

export default function Header() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    // Load current user data
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setCurrentUser(null);
      }
    };

    // Load user data initially
    loadUserData();

    // Listen for localStorage changes (for when user signs in/out in the same tab)
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check on location changes (for when user navigates after registration)
    loadUserData();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location]); // Re-run when location changes

  const handleSignOut = () => {
    // Clear user data from localStorage
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setLocation('/register');
  };

  const handleViewProfile = () => {
    if (currentUser?.email) {
      setLocation(`/profile/${encodeURIComponent(currentUser.email)}`);
    }
  };

  // Don't show header on auth pages
  const currentPath = window.location.pathname;
  if (currentPath === '/' || currentPath === '/register' || currentPath === '/login') {
    return null;
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <h1 
            className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent cursor-pointer"
            onClick={() => setLocation("/groups")}
            data-testid="logo"
          >
            {SITE_NAME}
          </h1>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/groups")}
              data-testid="nav-groups"
            >
              <Users className="h-4 w-4 mr-2" />
              Groups
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/messages")}
              data-testid="nav-messages"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
            </Button>
          </nav>
        </div>

        {/* User Menu */}
        {currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={currentUser.profileImages?.[0] || ""} 
                    alt={currentUser.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{currentUser.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewProfile} data-testid="menu-profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} data-testid="menu-sign-out">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            onClick={() => setLocation('/register')}
            size="sm"
            data-testid="button-sign-in"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}