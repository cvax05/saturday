import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, GraduationCap, Mail, ChevronRight, User, Loader2 } from "lucide-react";
import type { User as UserType, AuthResponse } from "@shared/schema";

export default function People() {
  const [, setLocation] = useLocation();

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
  });

  // Fetch users from the same school (JWT automatically provides school scoping)
  const { data: schoolUsersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/school'],
    enabled: !!authData?.user,
  });

  const currentUser = authData?.user;
  const schoolmates = (schoolUsersData as any)?.users?.filter((user: UserType) => 
    user.email !== currentUser?.email
  ) || [];

  const handleViewProfile = (userEmail: string) => {
    setLocation(`/profile/${encodeURIComponent(userEmail)}`);
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
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to see people from your school.
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
    <div className="min-h-screen bg-background p-4 pb-20">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            People at Your School
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <GraduationCap className="h-4 w-4" />
            <span>{currentUser?.school || "Your School"}</span>
          </div>
          {!usersLoading && (
            <Badge variant="secondary" className="mt-2">
              {schoolmates.length} Person{schoolmates.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Loading state for users */}
        {usersLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading people from your school...</p>
          </div>
        )}

        {/* Empty state */}
        {!usersLoading && schoolmates.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Other Students Yet</h2>
            <p className="text-muted-foreground mb-4">
              You're the first person from your school to join! Invite your friends to connect.
            </p>
          </div>
        )}

        {/* People List */}
        {!usersLoading && schoolmates.length > 0 && (
          <div className="space-y-4">
            {schoolmates.map((person: UserType, index: number) => (
              <Card key={person.email} className="hover-elevate" data-testid={`person-card-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Profile Picture */}
                      <Avatar className="h-16 w-16">
                        <AvatarImage 
                          src={person.profileImages?.[0] || ""} 
                          alt={person.displayName || person.username} 
                        />
                        <AvatarFallback className="text-lg font-bold">
                          {(person.displayName || person.username)
                            .split(' ')
                            .map((word: string) => word[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Person Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-xl font-bold mb-1" data-testid={`person-name-${index}`}>
                              {person.displayName || person.username}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Mail className="h-3 w-3" />
                              <span>{person.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <User className="h-3 w-3" />
                              <span>@{person.username}</span>
                            </div>
                          </div>
                        </div>

                        {/* School Badge */}
                        {person.school && (
                          <div className="mb-3">
                            <Badge variant="outline" className="text-xs">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {person.school}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(person.email)}
                        data-testid={`button-view-profile-${index}`}
                      >
                        <span className="mr-1">View Profile</span>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setLocation(`/messages?user=${encodeURIComponent(person.email)}`)}
                        data-testid={`button-message-${index}`}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}