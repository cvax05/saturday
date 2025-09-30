import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  availability: string;
}

export default function UserProfileDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/profile/:email");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

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
        
        // Load current user data for authentication context
        const currentUserData = localStorage.getItem('currentUser');
        if (currentUserData) {
          const currentUserInfo = JSON.parse(currentUserData);
          setCurrentUser(currentUserInfo);
          
          // Check if this is the user's own profile
          const isOwn = isUserId ? currentUserInfo.id === targetParam : currentUserInfo.email === targetParam;
          setIsOwnProfile(isOwn);
          
          if (isOwn) {
            // Transform current user data to match UserProfile interface - only use real data
            const profileData = {
              id: currentUserInfo.id,
              name: currentUserInfo.displayName || currentUserInfo.username, // Only use provided data
              username: currentUserInfo.username,
              displayName: currentUserInfo.displayName,
              email: currentUserInfo.email,
              school: currentUserInfo.school, // Don't add fake school data
              description: currentUserInfo.bio || currentUserInfo.description, // Don't force empty string
              classYear: currentUserInfo.classYear,
              profileImage: currentUserInfo.avatarUrl || currentUserInfo.profileImages?.[0] || currentUserInfo.profileImage,
              profileImages: currentUserInfo.profileImages || [], // Registration photos
              createdAt: currentUserInfo.createdAt, // Don't create fake timestamps
              photos: currentUserInfo.photos || [],
              // Legacy fields - only if they exist
              groupSize: currentUserInfo.groupSize,
              groupSizeMin: currentUserInfo.groupSizeMin,
              groupSizeMax: currentUserInfo.groupSizeMax,
              preferredAlcohol: currentUserInfo.preferredAlcohol,
              availability: currentUserInfo.availability
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
              profileImage: userData.user.avatarUrl || userData.user.profileImages?.[0] || null,
              profileImages: userData.user.profileImages || [], // Registration photos
              createdAt: userData.user.createdAt,
              photos: userData.photos || [],
              // Legacy fields - don't add fake data
              groupSize: userData.user.groupSize,
              groupSizeMin: userData.user.groupSizeMin, 
              groupSizeMax: userData.user.groupSizeMax,
              preferredAlcohol: userData.user.preferredAlcohol,
              availability: userData.user.availability
            };
            
            setUserProfile(profileData);
            console.log('UserProfileDetail: Loaded profile with pregame prefs:', {
              username: userData.user.username,
              groupSizeMin: profileData.groupSizeMin,
              groupSizeMax: profileData.groupSizeMax,
              preferredAlcohol: profileData.preferredAlcohol,
              availability: profileData.availability
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
  }, [params?.email]);

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation("/groups")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Card - Horizontal Layout */}
        <Card className="mb-6">
          <CardHeader className="pb-6">
            <div className="flex items-start gap-8">
              {/* Larger Avatar */}
              <Avatar className="h-48 w-48 border-4 border-border">
                <AvatarImage 
                  src={userProfile.profileImage || ""} 
                  alt={userProfile.name || ""} 
                  className="object-cover"
                />
                <AvatarFallback className="text-6xl font-bold bg-muted">
                  {(userProfile.name || "").split(' ').map((word: string) => word[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Main Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <CardTitle className="text-4xl mb-3" data-testid="profile-name">
                      {userProfile.name}
                    </CardTitle>
                    
                    <div className="flex items-center gap-2 text-lg text-muted-foreground mb-2">
                      <Mail className="h-5 w-5" />
                      <span data-testid="profile-email">{userProfile.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-lg text-muted-foreground mb-2">
                      <User className="h-5 w-5" />
                      <span data-testid="profile-username">@{userProfile.username}</span>
                      {userProfile.displayName && userProfile.displayName !== userProfile.username && (
                        <span className="text-sm">({userProfile.displayName})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-lg text-muted-foreground mb-2">
                      <GraduationCap className="h-5 w-5" />
                      <span data-testid="profile-school">{userProfile.school}</span>
                      {userProfile.classYear && (
                        <Badge variant="secondary" className="ml-2">
                          Class of '{String(userProfile.classYear).slice(-2)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span data-testid="profile-member-since">
                        Member since {new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Edit button - only show for own profile */}
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation("/profile/edit")}
                      data-testid="button-edit-profile"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* About Section in Header */}
                {userProfile.description && (
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-3">About</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed" data-testid="profile-description">
                      {userProfile.description}
                    </p>
                  </div>
                )}

                {/* Message button - only show for other users' profiles */}
                {!isOwnProfile && (
                  <MessageDialog 
                    recipientName={userProfile.name} 
                    recipientEmail={userProfile.email}
                  />
                )}
              </div>
            </div>
          </CardHeader>

        </Card>

        {/* Content Grid - More Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Pregame Preferences - Only show if user has filled out preferences */}
            {(userProfile.preferredAlcohol || userProfile.groupSize || userProfile.groupSizeMin || userProfile.groupSizeMax || userProfile.availability) && (
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Pregame Preferences</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preferred Alcohol */}
                  {userProfile.preferredAlcohol && (
                    <div className="flex items-center gap-3">
                      <Wine className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Preferred Drinks:</span>
                      <Badge className={getPreferredAlcoholColor(userProfile.preferredAlcohol)} data-testid="profile-alcohol">
                        {userProfile.preferredAlcohol}
                      </Badge>
                    </div>
                  )}

                  {/* Group Size Preference */}
                  {userProfile.groupSize && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Group Size:</span>
                      <Badge variant="secondary" data-testid="profile-group-size">
                        {userProfile.groupSize}
                      </Badge>
                    </div>
                  )}

                  {/* Group Size Range */}
                  {(userProfile.groupSizeMin || userProfile.groupSizeMax) && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Looking for groups of:</span>
                      <Badge variant="outline" data-testid="profile-group-range">
                        {userProfile.groupSizeMin || '?'} - {userProfile.groupSizeMax || '?'} people
                      </Badge>
                    </div>
                  )}

                  {/* Availability */}
                  {userProfile.availability && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Availability:</span>
                      <Badge variant="outline" data-testid="profile-availability">
                        {userProfile.availability}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Photo Gallery */}
            {((userProfile.profileImages && userProfile.profileImages.length > 0) || 
              (userProfile.photos && userProfile.photos.length > 0)) && (
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Photos</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="photo-gallery">
                    {/* Display registration photos */}
                    {userProfile.profileImages && userProfile.profileImages.map((imageUrl, index) => (
                      <div key={`profile-${index}`} className="relative">
                        <img
                          src={imageUrl}
                          alt={`User photo ${index + 1}`}
                          className="w-full h-40 object-contain rounded-lg border bg-muted"
                          data-testid={`photo-profile-${index}`}
                        />
                      </div>
                    ))}
                    {/* Display legacy photos for backwards compatibility */}
                    {userProfile.photos && userProfile.photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.url}
                          alt="User photo"
                          className="w-full h-40 object-contain rounded-lg border bg-muted"
                          data-testid={`photo-${photo.id}`}
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
      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-xl font-semibold">Reviews</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show reviews section if there are no reviews
  }

  const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0" data-testid={`review-${review.id}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
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
                <p className="text-sm text-muted-foreground" data-testid={`review-message-${review.id}`}>
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