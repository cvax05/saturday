import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Users, MessageCircle, Calendar, Loader2 } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { queryClient, apiRequest, authQueryFn } from "@/lib/queryClient";
import type { AuthResponse } from "@shared/schema";

export default function Header() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/logout'),
    onSuccess: () => {
      // Clear all query cache after logout
      queryClient.clear();
      setLocation('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails, clear cache and redirect
      queryClient.clear();
      setLocation('/login');
    }
  });

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  const handleViewProfile = () => {
    if (currentUser?.email) {
      setLocation(`/profile/${encodeURIComponent(currentUser.email)}`);
    }
  };

  // Don't show header on auth pages and home page
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
          
          {/* Navigation - only show when authenticated */}
          {currentUser && (
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
                onClick={() => setLocation("/calendar")}
                data-testid="nav-calendar"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
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
          )}
        </div>

        {/* User Menu */}
        {authLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={currentUser.avatarUrl || currentUser.profileImages?.[0] || ""} 
                    alt={currentUser.username}
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {currentUser.username?.slice(0, 2).toUpperCase() || currentUser.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{currentUser.username || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                  {currentUser.school && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.school}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewProfile} data-testid="menu-profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                disabled={logoutMutation.isPending}
                data-testid="menu-sign-out"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            onClick={() => setLocation('/login')}
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