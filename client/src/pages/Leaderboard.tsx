import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Calendar, Mail, Trophy, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Organization {
  id: string;
  name: string;
  school: string;
  description: string;
  memberCount: number;
  groupType: string;
  establishedYear: number;
  contactEmail: string;
  socialMedia: string;
  profileImage: string;
}

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const [userSchool, setUserSchool] = useState<string>("");

  // Get user's school from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.school) {
          setUserSchool(user.school);
        } else {
          // Default school if user doesn't have one set
          setUserSchool("University of California, Berkeley");
        }
      } else {
        // Default school if no user data
        setUserSchool("University of California, Berkeley");
      }
    } catch (error) {
      console.error("Error getting user school:", error);
      setUserSchool("University of California, Berkeley");
    }
  }, []);

  const { data: organizationsData, isLoading, error } = useQuery({
    queryKey: ['organizations', userSchool],
    queryFn: () => fetch(`/api/organizations/school/${encodeURIComponent(userSchool)}`).then(res => res.json()),
    enabled: !!userSchool
  });

  const organizations: Organization[] = organizationsData?.organizations || [];

  // Sort organizations by member count (leaderboard style)
  const sortedOrganizations = [...organizations].sort((a, b) => b.memberCount - a.memberCount);

  const handleSeeMore = (orgId: string) => {
    setLocation(`/organization/${orgId}`);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType.toLowerCase()) {
      case 'fraternity': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sorority': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'student government': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'club': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <main className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading organizations...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !organizations.length) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <main className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Organizations Found</h2>
            <p className="text-muted-foreground mb-4">
              No organizations are currently registered for {userSchool}.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Organization Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top organizations at {userSchool}
          </p>
          <Badge variant="secondary" className="mt-2">
            {organizations.length} Organization{organizations.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-4">
          {sortedOrganizations.map((org, index) => (
            <Card key={org.id} className="hover-elevate" data-testid={`org-card-${org.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Rank */}
                    <div className="text-2xl font-bold min-w-[3rem] text-center">
                      {getRankIcon(index)}
                    </div>

                    {/* Organization Avatar */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={org.profileImage} alt={org.name} />
                      <AvatarFallback className="text-lg font-bold">
                        {org.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Organization Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1" data-testid={`org-name-${org.id}`}>
                            {org.name}
                          </h3>
                          <Badge 
                            className={`text-xs ${getGroupTypeColor(org.groupType)}`}
                            data-testid={`org-type-${org.id}`}
                          >
                            {org.groupType}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2" data-testid={`org-description-${org.id}`}>
                        {org.description}
                      </p>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span data-testid={`org-members-${org.id}`}>{org.memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Est. {org.establishedYear}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{org.contactEmail}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSeeMore(org.id)}
                        className="gap-2"
                        data-testid={`button-see-more-${org.id}`}
                      >
                        See More
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/home")}
            data-testid="button-back-home"
          >
            Back to Home
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setLocation("/home")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
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
            onClick={() => setLocation("/calendar")}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-muted-foreground hover:text-foreground"
            data-testid="nav-calendar"
          >
            <span className="text-xs font-medium">Calendar</span>
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
    </div>
  );
}