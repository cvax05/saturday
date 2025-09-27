import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, GraduationCap, Mail, ChevronRight, Building } from "lucide-react";

interface GroupProfile {
  name: string;
  groupSize: string;
  email: string;
  school: string;
  description: string;
  groupSizeMin: string;
  groupSizeMax: string;
  preferredAlcohol: string;
  availability: string;
  profileImage: string | null;
  id?: string;
}

export default function Groups() {
  const [, setLocation] = useLocation();
  const [currentUserSchool, setCurrentUserSchool] = useState<string>("");
  const [schoolGroups, setSchoolGroups] = useState<GroupProfile[]>([]);

  useEffect(() => {
    // Get current user's school and load all groups from the same school
    try {
      const currentUserData = localStorage.getItem('currentUser');
      const allUsersData = localStorage.getItem('allUsers');
      
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData);
        const userSchool = currentUser.school || "";
        setCurrentUserSchool(userSchool);
        
        if (allUsersData && userSchool) {
          const allUsers = JSON.parse(allUsersData);
          // Filter users by school - include ALL groups/organizations from same school
          const schoolUsers = allUsers.filter((user: GroupProfile) => 
            user.school === userSchool
          );
          setSchoolGroups(schoolUsers);
        }
      }
    } catch (error) {
      console.error("Error loading groups data:", error);
    }
  }, []);

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

  if (!currentUserSchool) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No School Information</h2>
            <p className="text-muted-foreground mb-4">
              Please complete your registration to see groups from your school.
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
            <Building className="h-8 w-8 text-primary" />
            Groups & Organizations
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <GraduationCap className="h-4 w-4" />
            <span>{currentUserSchool}</span>
          </div>
          <Badge variant="secondary" className="mt-2">
            {schoolGroups.length} Group{schoolGroups.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          {schoolGroups.map((group, index) => (
            <Card key={group.email} className="hover-elevate" data-testid={`group-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Group Avatar */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={group.profileImage || ""} alt={group.name} />
                      <AvatarFallback className="text-lg font-bold">
                        {group.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1" data-testid={`group-name-${index}`}>
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Users className="h-3 w-3" />
                            <span>{group.groupSize} members</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {group.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      {/* Attributes */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {group.preferredAlcohol && (
                          <Badge variant="outline" className={getPreferredAlcoholColor(group.preferredAlcohol)}>
                            {group.preferredAlcohol}
                          </Badge>
                        )}
                        {group.availability && (
                          <Badge variant="outline">
                            {group.availability}
                          </Badge>
                        )}
                      </div>

                      {/* Group Size Range */}
                      {(group.groupSizeMin || group.groupSizeMax) && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Looking for groups of {group.groupSizeMin || '?'} - {group.groupSizeMax || '?'} people
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProfile(group.email)}
                    className="shrink-0"
                    data-testid={`button-view-group-${index}`}
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
        {schoolGroups.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Groups Found</h2>
            <p className="text-muted-foreground mb-4">
              No groups or organizations have registered from {currentUserSchool} yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Be the first to create connections with pregame groups at your school!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}