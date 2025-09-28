import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
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
  Edit
} from "lucide-react";

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
  photos: { id: string; url: string; }[];
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
            // Transform current user data to match UserProfile interface
            const profileData = {
              name: currentUserInfo.username || currentUserInfo.displayName || currentUserInfo.name,
              email: currentUserInfo.email,
              school: currentUserInfo.school || 'Unknown School',
              description: currentUserInfo.bio || currentUserInfo.description || '',
              profileImage: currentUserInfo.avatarUrl || currentUserInfo.profileImage,
              groupSize: '1',
              groupSizeMin: '1',
              groupSizeMax: '1',
              preferredAlcohol: '',
              availability: '',
              photos: currentUserInfo.photos || []
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
            
            // Transform the API response to match the UserProfile interface
            const profileData = {
              name: userData.user.username || userData.user.displayName || 'Student',
              email: userData.user.email,
              school: userData.schools?.[0]?.name || userData.user.school || 'Unknown School',
              description: userData.user.bio || '',
              profileImage: userData.user.avatarUrl || userData.user.profileImages?.[0] || null,
              groupSize: '1',
              groupSizeMin: '1', 
              groupSizeMax: '1',
              preferredAlcohol: '',
              availability: '',
              photos: userData.photos || []
            };
            
            setUserProfile(profileData);
            console.log('UserProfileDetail: Found user via API:', userData.user.username);
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
          Back to Roster
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
                    
                    <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                      <GraduationCap className="h-5 w-5" />
                      <span data-testid="profile-school">{userProfile.school}</span>
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
            {/* Pregame Preferences */}
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

            {/* Contact Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Get in Touch</h3>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Photo Gallery */}
            {userProfile.photos && userProfile.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Photos</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="photo-gallery">
                    {userProfile.photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.url}
                          alt="User photo"
                          className="w-full h-40 object-cover rounded-lg border"
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
      </div>
    </div>
  );
}