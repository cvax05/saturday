import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, GraduationCap, MessageCircle, ChevronRight, Loader2, User as UserIcon } from "lucide-react";
import { authQueryFn } from "@/lib/queryClient";
import type { AuthResponse, User } from "@shared/schema";
import FilterPanel, { type FilterState } from "@/components/FilterPanel";
import { useState } from "react";

export default function Groups() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<FilterState>({});

  // Get current user and authentication status
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  // Build query parameters from filters
  const buildQueryParams = (filters: FilterState): string => {
    const params = new URLSearchParams();
    if (filters.saturday) params.append('saturday', filters.saturday);
    if (filters.music) params.append('music', filters.music);
    if (filters.vibe) params.append('vibe', filters.vibe);
    if (filters.groupSizeMin) params.append('groupSizeMin', filters.groupSizeMin);
    if (filters.groupSizeMax) params.append('groupSizeMax', filters.groupSizeMax);
    return params.toString();
  };

  // Get filtered or all school users
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');
  const queryParams = buildQueryParams(filters);
  const endpoint = hasActiveFilters 
    ? `/api/users/filter?${queryParams}`
    : '/api/users/school';

  const { data: schoolUsersData, isLoading: usersLoading } = useQuery<{ users: User[] }>({
    queryKey: [endpoint],
    enabled: !!authData?.user,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });

  const currentUser = authData?.user;
  const schoolUsers = schoolUsersData?.users || [];
  
  // Filter out current user to get other groups
  const otherGroups = schoolUsers.filter(user => user.email !== currentUser?.email);
  const otherGroupsCount = otherGroups.length;
  
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
              <h1 className="text-3xl font-bold" data-testid="groups-title">{schoolName}</h1>
              <p className="text-muted-foreground">Browse Groups</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {otherGroupsCount} groups found at your school
            </span>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel 
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={() => setFilters({})}
        />

        {/* Loading state */}
        {usersLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        )}

        {/* User Cards Grid */}
        {!usersLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {otherGroupsCount === 0 ? (
              <div className="col-span-full text-center py-12">
                <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
                <p className="text-muted-foreground">
                  There are no other groups at {schoolName} yet.
                </p>
              </div>
            ) : (
              otherGroups.map((user) => (
                  <Card 
                    key={user.id || user.email} 
                    className="hover-elevate cursor-pointer transition-all min-h-[240px]"
                    data-testid={`user-card-${user.email}`}
                    onClick={() => handleViewProfile(user.id)}
                  >
                    <CardContent className="p-8 h-full">
                      <div className="flex items-center gap-6 h-full">
                        {/* Large Profile Image */}
                        <Avatar className="h-32 w-32 flex-shrink-0 border-4 border-primary/20 ring-2 ring-primary/10">
                          <AvatarImage 
                            src={user.avatarUrl || user.profileImages?.[0] || ""} 
                            alt={user.username}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                            {(user.username || user.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                          <h3 className="text-lg font-bold line-clamp-2 text-center" data-testid={`user-name-${user.email}`}>
                            {user.displayName || user.username || 'Student'}
                          </h3>
                          {user.displayName && user.username && user.displayName !== user.username && (
                            <p className="text-sm text-muted-foreground text-center">@{user.username}</p>
                          )}
                          {(user.groupSizeMin || user.groupSizeMax) && (
                            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
                              <Users className="h-3 w-3" />
                              {user.groupSizeMin === user.groupSizeMax 
                                ? user.groupSizeMin 
                                : `${user.groupSizeMin || 0}-${user.groupSizeMax || 0}`} people
                            </p>
                          )}
                          {user.school && (
                            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {user.school}
                            </p>
                          )}
                          <Button
                            size="lg"
                            variant="default"
                            className="w-full font-semibold mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(user.id);
                            }}
                            data-testid={`button-view-profile-${user.email}`}
                          >
                            View Profile
                            <ChevronRight className="h-5 w-5 ml-2" />
                          </Button>
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