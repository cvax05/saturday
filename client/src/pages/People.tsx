import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, GraduationCap, Mail, ChevronRight, User } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  school: string;
  description: string;
  groupSize: string;
  groupSizeMin: string;
  groupSizeMax: string;
  preferredAlcohol: string;
  availability: string;
  profileImage: string | null;
}

export default function People() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<{ email: string; school: string } | null>(null);

  // Get current user from localStorage
  useEffect(() => {
    try {
      const currentUserData = localStorage.getItem('currentUser');
      if (currentUserData) {
        const userData = JSON.parse(currentUserData);
        setCurrentUser({ email: userData.email, school: userData.school || "" });
      }
    } catch (error) {
      console.error("Error loading current user data:", error);
    }
  }, []);

  // Fetch users from the same school via API
  const { data: schoolUsersData, isLoading } = useQuery({
    queryKey: ['/api/users/school', currentUser?.school],
    enabled: !!currentUser?.school,
  });

  const schoolmates = (schoolUsersData as any)?.users?.filter((user: UserProfile) => 
    user.email !== currentUser?.email
  ) || [];

  const handleViewProfile = (userEmail: string) => {
    setLocation(`/profile/${encodeURIComponent(userEmail)}`);
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

  if (!currentUser?.school) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No School Information</h2>
            <p className="text-muted-foreground mb-4">
              Please complete your registration to see people from your school.
            </p>
            <Button onClick={() => setLocation("/register")} data-testid="button-register">
              Complete Registration
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
            <span>{currentUser?.school}</span>
          </div>
          <Badge variant="secondary" className="mt-2">
            {schoolmates.length} Person{schoolmates.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* People List */}
        <div className="space-y-4">
          {schoolmates.map((person: any, index: number) => (
            <Card key={person.email} className="hover-elevate" data-testid={`person-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Profile Picture */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={person.profileImage || ""} alt={person.name} />
                      <AvatarFallback className="text-lg font-bold">
                        {person.name.split(' ').map((word: string) => word[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Person Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1" data-testid={`person-name-${index}`}>
                            {person.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Mail className="h-3 w-3" />
                            <span>{person.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {person.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {person.description}
                        </p>
                      )}

                      {/* Attributes */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {person.preferredAlcohol && (
                          <Badge variant="outline" className={getPreferredAlcoholColor(person.preferredAlcohol)}>
                            {person.preferredAlcohol}
                          </Badge>
                        )}
                        {person.groupSize && (
                          <Badge variant="secondary">
                            Group Size: {person.groupSize}
                          </Badge>
                        )}
                        {person.availability && (
                          <Badge variant="outline">
                            {person.availability}
                          </Badge>
                        )}
                      </div>

                      {/* Group Size Range */}
                      {(person.groupSizeMin || person.groupSizeMax) && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Looking for groups of {person.groupSizeMin || '?'} - {person.groupSizeMax || '?'} people
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProfile(person.email)}
                    className="shrink-0"
                    data-testid={`button-view-profile-${index}`}
                  >
                    View Profile
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {schoolmates.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No People Found</h2>
            <p className="text-muted-foreground mb-4">
              No other students have registered from {currentUser?.school} yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Be the first to connect with pregame groups at your school!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}