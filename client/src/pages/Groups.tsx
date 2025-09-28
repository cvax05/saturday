import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, GraduationCap, MessageCircle, ChevronRight, Loader2, User as UserIcon } from "lucide-react";
import type { AuthResponse, User } from "@shared/schema";

export default function Groups() {
  const [, setLocation] = useLocation();

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
  });

  // Get school users roster
  const { data: schoolUsersData, isLoading: usersLoading } = useQuery<{ users: User[] }>({
    queryKey: ['/api/users/school'],
    enabled: !!authData?.user,
  });

  const currentUser = authData?.user;
  const schoolUsers = schoolUsersData?.users || [];
  
  // Get school name - try multiple sources for school information
  const schoolName = currentUser?.school || 
    (schoolUsers.length > 0 ? schoolUsers[0]?.school : null) ||
    "Princeton University"; // Default to Princeton since that's what shows in profile

  const handleViewProfile = (userId: string) => {
    setLocation(`/profile/${userId}`);
  };

  const handleStartMessage = (userEmail: string) => {
    setLocation(`/messages/${encodeURIComponent(userEmail)}`);
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
            <UserIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="groups-title">{schoolName} Roster</h1>
              <p className="text-muted-foreground">Browse students at your school</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {schoolUsers.length} students found
            </span>
          </div>
        </div>

        {/* Loading state */}
        {usersLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        )}

        {/* User Cards Grid */}
        {!usersLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schoolUsers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Students Found</h3>
                <p className="text-muted-foreground">
                  There are no other students at {schoolName.toLowerCase()} yet.
                </p>
              </div>
            ) : (
              schoolUsers
                .filter(user => user.email !== currentUser?.email) // Exclude current user
                .map((user) => (
                  <Card 
                    key={user.id || user.email} 
                    className="hover-elevate cursor-pointer transition-shadow"
                    data-testid={`user-card-${user.email}`}
                    onClick={() => handleViewProfile(user.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {/* Profile Image */}
                        <Avatar className="h-16 w-16 border-2 border-border">
                          <AvatarImage 
                            src={user.avatarUrl || user.profileImages?.[0] || ""} 
                            alt={user.username}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-sm font-semibold">
                            {(user.username || user.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Name Only */}
                        <h3 className="font-semibold truncate" data-testid={`user-name-${user.email}`}>
                          {user.username || user.displayName || 'Student'}
                        </h3>

                        {/* Single View Profile Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(user.id);
                          }}
                          data-testid={`button-view-profile-${user.email}`}
                        >
                          <ChevronRight className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
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