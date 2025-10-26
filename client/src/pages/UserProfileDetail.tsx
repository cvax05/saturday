import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { authQueryFn } from "@/lib/queryClient";
import type { AuthResponse } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import MessageDialog from "@/components/MessageDialog";
import { 
  User, 
  Mail, 
  GraduationCap, 
  Users, 
  Calendar, 
  Wine,
  ArrowLeft,
  MessageCircle,
  Edit,
  Star
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  displayName?: string;
  email: string;
  school: string;
  description: string;
  classYear?: number;
  profileImage: string | null;
  profileImages: string[]; // Array of image URLs from registration
  photos: { id: string; url: string; }[]; // Legacy field for compatibility
  createdAt: string;
  // Legacy fields for pregame preferences (may not be filled)
  groupSize: string;
  groupSizeMin: string;
  groupSizeMax: string;
  preferredAlcohol: string;
}

export default function UserProfileDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/profile/:email");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Fetch current user from API
  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: authQueryFn as any,
  });

  const currentUser = authData?.user;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!params?.email) {
        setLoading(false);
        return;
      }

      try {
        const targetParam = decodeURIComponent(params.email);
        
        // Check if the parameter is a user ID (UUID format) or email
        const isUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetParam);
        
        // Check if this is the user's own profile (using API data)
        if (currentUser) {
          const isOwn = isUserId ? currentUser.id === targetParam : currentUser.email === targetParam;
          setIsOwnProfile(isOwn);
          
          if (isOwn) {
            // Transform current user data to match UserProfile interface - only use real data
            const profileData: UserProfile = {
              id: currentUser.id,
              name: currentUser.displayName || currentUser.username,
              username: currentUser.username,
              displayName: currentUser.displayName || undefined,
              email: currentUser.email,
              school: currentUser.school || "",
              description: currentUser.bio || "",
              classYear: undefined,
              profileImage: currentUser.avatarUrl || null,
              profileImages: currentUser.galleryImages || [],
              createdAt: "",
              photos: [],
              groupSize: "",
              groupSizeMin: currentUser.groupSizeMin?.toString() || "",
              groupSizeMax: currentUser.groupSizeMax?.toString() || "",
              preferredAlcohol: currentUser.preferredAlcohol || ""
            };
            setUserProfile(profileData);
            setLoading(false);
            return;
          }
        }

        // Fetch from API based on parameter type
        console.log('UserProfileDetail: Fetching user profile via API for:', targetParam);
        try {
          let apiUrl;
          if (isUserId) {
            // Use the new user ID endpoint for direct user lookup
            apiUrl = `/api/users/${encodeURIComponent(targetParam)}`;
          } else {
            // Use email endpoint for email lookup
            apiUrl = `/api/users/email/${encodeURIComponent(targetParam)}`;
          }
          
          const userResponse = await fetch(apiUrl);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            console.log('UserProfileDetail: API response:', {
              hasAvatarUrl: !!userData.user.avatarUrl,
              hasProfileImages: !!userData.user.profileImages,
              profileImagesLength: userData.user.profileImages?.length || 0,
              avatarUrlPrefix: userData.user.avatarUrl?.substring(0, 30)
            });
            
            // Transform the API response to match the UserProfile interface - only use real data
            const profileData = {
              id: userData.user.id,
              name: userData.user.displayName || userData.user.username, // Don't add fake "Student" name
              username: userData.user.username,
              displayName: userData.user.displayName,
              email: userData.user.email,
              school: userData.schools?.[0]?.name || userData.user.school, // Don't add fake "Unknown School"
              description: userData.user.bio, // Don't force empty string
              classYear: userData.user.classYear,
              profileImage: userData.user.avatarUrl || null,
              profileImages: userData.user.profileImages || [], // Gallery photos
              createdAt: userData.user.createdAt,
              photos: userData.photos || [],
              // Legacy fields - don't add fake data
              groupSize: userData.user.groupSize,
              groupSizeMin: userData.user.groupSizeMin, 
              groupSizeMax: userData.user.groupSizeMax,
              preferredAlcohol: userData.user.preferredAlcohol
            };
            
            console.log('UserProfileDetail: Profile data:', {
              profileImage: profileData.profileImage?.substring(0, 30),
              profileImagesCount: profileData.profileImages.length
            });
            
            setUserProfile(profileData);
            console.log('UserProfileDetail: Loaded profile with pregame prefs:', {
              username: userData.user.username,
              groupSizeMin: profileData.groupSizeMin,
              groupSizeMax: profileData.groupSizeMax,
              preferredAlcohol: profileData.preferredAlcohol
            });
          } else {
            console.log('UserProfileDetail: User not found via API:', userResponse.status);
          }
        } catch (error) {
          console.error('UserProfileDetail: Error fetching user data:', error);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [params?.email, currentUser]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This user profile could not be found.
            </p>
            <Button onClick={() => setLocation("/people")} data-testid="button-back-to-people">
              Back to People
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto w-full">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="default"
          onClick={() => setLocation("/groups")}
          className="mb-4 sm:mb-6 min-h-[44px]"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Card - Horizontal on large screens, vertical on mobile */}
        <Card className="mb-6 w-full">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
              {/* Avatar - centered on mobile, left on desktop */}
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 border-2 sm:border-4 border-border shrink-0">
                <AvatarImage 
                  src={userProfile.profileImage || ""} 
                  alt={userProfile.name || ""} 
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl sm:text-5xl md:text-6xl font-bold bg-muted">
                  {(userProfile.name || "").split(' ').map((word: string) => word[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Main Profile Info */}
              <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex-1 w-full">
                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 break-words" data-testid="profile-name">
                      {userProfile.name}
                    </CardTitle>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base md:text-lg text-muted-foreground mb-2">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      <span className="truncate" data-testid="profile-email">{userProfile.email}</span>
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base md:text-lg text-muted-foreground mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span data-testid="profile-username">@{userProfile.username}</span>
                      </div>
                      {userProfile.displayName && userProfile.displayName !== userProfile.username && (
                        <span className="text-xs sm:text-sm">({userProfile.displayName})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base md:text-lg text-muted-foreground mb-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="truncate" data-testid="profile-school">{userProfile.school}</span>
                      </div>
                      {userProfile.classYear && (
                        <Badge variant="secondary" className="ml-0 sm:ml-2">
                          Class of '{String(userProfile.classYear).slice(-2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Edit button - only show for own profile */}
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation("/profile/edit")}
                      data-testid="button-edit-profile"
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* About Section in Header */}
                {userProfile.description && (
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">About</h3>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed break-words" data-testid="profile-description">
                      {userProfile.description}
                    </p>
                  </div>
                )}

                {/* Message button - only show for other users' profiles */}
                {!isOwnProfile && (
                  <div className="w-full sm:w-auto">
                    <MessageDialog 
                      recipientName={userProfile.name} 
                      recipientEmail={userProfile.email}
                      recipientId={userProfile.id}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

        </Card>

        {/* Content Grid - Stack on mobile, side-by-side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Pregame Preferences - Only show if user has filled out preferences */}
            {(userProfile.preferredAlcohol || userProfile.groupSize || userProfile.groupSizeMin || userProfile.groupSizeMax) && (
              <Card className="w-full">
                <CardHeader>
                  <h3 className="text-lg sm:text-xl font-semibold">Pregame Preferences</h3>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Preferred Alcohol */}
                  {userProfile.preferredAlcohol && (
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Wine className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Preferred Drinks:</span>
                      <Badge className={getPreferredAlcoholColor(userProfile.preferredAlcohol)} data-testid="profile-alcohol">
                        {userProfile.preferredAlcohol}
                      </Badge>
                    </div>
                  )}

                  {/* Group Size Preference */}
                  {userProfile.groupSize && (
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Group Size:</span>
                      <Badge variant="secondary" data-testid="profile-group-size">
                        {userProfile.groupSize}
                      </Badge>
                    </div>
                  )}

                  {/* Group Size Range */}
                  {(userProfile.groupSizeMin || userProfile.groupSizeMax) && (
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Looking for groups of:</span>
                      <Badge variant="outline" data-testid="profile-group-range">
                        {userProfile.groupSizeMin || '?'} - {userProfile.groupSizeMax || '?'} people
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Photo Gallery - Always show if there are ANY photos */}
            {userProfile.profileImages && userProfile.profileImages.length > 0 && (
              <Card className="w-full">
                <CardHeader>
                  <h3 className="text-lg sm:text-xl font-semibold">Photos ({userProfile.profileImages.length})</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4" data-testid="photo-gallery">
                    {userProfile.profileImages.map((imageUrl, index) => (
                      <div key={`profile-${index}`} className="relative aspect-square overflow-hidden rounded-lg border">
                        <img
                          src={imageUrl}
                          alt={`${userProfile.name}'s photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`photo-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection userId={userProfile.id} />
      </div>
    </div>
  );
}

function ReviewsSection({ userId }: { userId: string }) {
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: [`/api/reviews/user/${userId}`],
    enabled: !!userId,
  });

  const reviews = (reviewsData as any)?.reviews || [];

  if (isLoading) {
    return (
      <Card className="mt-4 sm:mt-6 w-full">
        <CardHeader>
          <h3 className="text-lg sm:text-xl font-semibold">Reviews</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs sm:text-sm">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show reviews section if there are no reviews
  }

  const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;

  return (
    <Card className="mt-4 sm:mt-6 w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-semibold">Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="border-b last:border-0 pb-3 sm:pb-4 last:pb-0" data-testid={`review-${review.id}`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 sm:h-4 sm:w-4 ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {review.message && (
                <p className="text-xs sm:text-sm text-muted-foreground break-words" data-testid={`review-message-${review.id}`}>
                  {review.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}