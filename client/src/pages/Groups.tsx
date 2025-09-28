import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, GraduationCap, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import type { AuthResponse, User } from "@shared/schema";

export default function Groups() {
  const [, setLocation] = useLocation();

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
  });

  // Get school users (groups/organizations in the same school)
  const { data: schoolUsersData, isLoading: usersLoading } = useQuery<{ users: User[] }>({
    queryKey: ['/api/users/school'],
    enabled: !!authData?.user,
  });

  const currentUser = authData?.user;
  const schoolGroups = schoolUsersData?.users || [];

  const handleViewProfile = (userEmail: string) => {
    setLocation(`/profile/${encodeURIComponent(userEmail)}`);
  };

  const handleStartMessage = (userEmail: string) => {
    setLocation(`/messages/${encodeURIComponent(userEmail)}`);
  };

  const getPreferredAlcoholColor = (alcohol: string) => {
    switch (alcohol.toLowerCase()) {
      case 'beer': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'wine': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'cocktails': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'vodka': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'whiskey': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'anything': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'none': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
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
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to view groups at your school.
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
      <main className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="groups-title">Groups</h1>
              <p className="text-muted-foreground">{currentUser?.school || "Your School"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {schoolGroups.length} groups found
            </span>
          </div>
        </div>

        {/* Loading state */}
        {usersLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        )}

        {/* Groups Grid */}
        {!usersLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schoolGroups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
                <p className="text-muted-foreground">
                  There are no other groups at {currentUser?.school || "your school"} yet.
                </p>
              </div>
            ) : (
              schoolGroups
                .filter(group => group.email !== currentUser?.email) // Exclude current user
                .map((group) => (
                  <Card 
                    key={group.id || group.email} 
                    className="hover-elevate cursor-pointer transition-shadow"
                    data-testid={`group-card-${group.email}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Profile Image */}
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage 
                            src={group.profileImages?.[0] || ""} 
                            alt={group.username}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-sm font-semibold">
                            {(group.username || group.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Group Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-sm truncate" data-testid={`group-name-${group.email}`}>
                              {group.username || 'Group'}
                            </h3>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              <Users className="h-3 w-3 mr-1" />
                              {(group as any).groupSize || '1'}
                            </Badge>
                          </div>
                          
                          {/* Description */}
                          {(group as any).description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {(group as any).description}
                            </p>
                          )}

                          {/* Group Details */}
                          <div className="space-y-2 mb-3">
                            {(group as any).groupSizeMin && (group as any).groupSizeMax && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Group Size:</span>
                                <Badge variant="outline" className="text-xs">
                                  {(group as any).groupSizeMin}-{(group as any).groupSizeMax} people
                                </Badge>
                              </div>
                            )}
                            
                            {(group as any).preferredAlcohol && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Preferred:</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPreferredAlcoholColor((group as any).preferredAlcohol)}`}
                                >
                                  {(group as any).preferredAlcohol}
                                </Badge>
                              </div>
                            )}
                            
                            {(group as any).availability && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Available:</span>
                                <Badge variant="outline" className="text-xs">
                                  {(group as any).availability}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-7"
                              onClick={() => handleViewProfile(group.email)}
                              data-testid={`button-view-profile-${group.email}`}
                            >
                              <ChevronRight className="h-3 w-3 mr-1" />
                              Profile
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 text-xs h-7"
                              onClick={() => handleStartMessage(group.email)}
                              data-testid={`button-message-${group.email}`}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}