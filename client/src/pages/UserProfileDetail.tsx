import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  GraduationCap, 
  Users, 
  Calendar, 
  Wine,
  ArrowLeft,
  MessageCircle
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
}

export default function UserProfileDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/profile/:email");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.email) {
      // For now, we're getting the user from localStorage
      // In a real app, this would fetch from a database by email/id
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email === decodeURIComponent(params.email)) {
            setUserProfile(user);
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
    setLoading(false);
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
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation("/people")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to People
        </Button>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.profileImage || ""} alt={userProfile.name} />
                <AvatarFallback className="text-2xl font-bold">
                  {userProfile.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2" data-testid="profile-name">
                  {userProfile.name}
                </CardTitle>
                
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Mail className="h-4 w-4" />
                  <span data-testid="profile-email">{userProfile.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <GraduationCap className="h-4 w-4" />
                  <span data-testid="profile-school">{userProfile.school}</span>
                </div>

                <Button size="sm" data-testid="button-message">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            {userProfile.description && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground" data-testid="profile-description">
                  {userProfile.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Pregame Preferences */}
            <div>
              <h3 className="font-semibold mb-4">Pregame Preferences</h3>
              
              <div className="space-y-4">
                {/* Preferred Alcohol */}
                {userProfile.preferredAlcohol && (
                  <div className="flex items-center gap-3">
                    <Wine className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Preferred Drinks:</span>
                    <Badge className={getPreferredAlcoholColor(userProfile.preferredAlcohol)} data-testid="profile-alcohol">
                      {userProfile.preferredAlcohol}
                    </Badge>
                  </div>
                )}

                {/* Group Size Preference */}
                {userProfile.groupSize && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Group Size:</span>
                    <Badge variant="secondary" data-testid="profile-group-size">
                      {userProfile.groupSize}
                    </Badge>
                  </div>
                )}

                {/* Group Size Range */}
                {(userProfile.groupSizeMin || userProfile.groupSizeMax) && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Looking for groups of:</span>
                    <Badge variant="outline" data-testid="profile-group-range">
                      {userProfile.groupSizeMin || '?'} - {userProfile.groupSizeMax || '?'} people
                    </Badge>
                  </div>
                )}

                {/* Availability */}
                {userProfile.availability && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Availability:</span>
                    <Badge variant="outline" data-testid="profile-availability">
                      {userProfile.availability}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Actions */}
            <div>
              <h3 className="font-semibold mb-4">Get in Touch</h3>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}