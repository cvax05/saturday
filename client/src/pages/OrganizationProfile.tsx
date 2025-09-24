import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Calendar, 
  Mail, 
  ArrowLeft, 
  Instagram, 
  Twitter, 
  Globe,
  MessageSquare,
  UserPlus 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function OrganizationProfile() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/organization/:id");
  const orgId = params?.id;

  const { data: orgData, isLoading, error } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => fetch(`/api/organizations/${orgId}`).then(res => res.json()),
    enabled: !!orgId
  });

  const organization = orgData?.organization;

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType?.toLowerCase()) {
      case 'fraternity': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sorority': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'student government': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'club': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const parseSocialMedia = (socialMediaString: string) => {
    try {
      return JSON.parse(socialMediaString || '{}');
    } catch {
      return {};
    }
  };

  const handleContactOrganization = () => {
    // In a real app, this would open a messaging interface
    setLocation(`/messages?contact=${organization?.contactEmail}`);
  };

  const handleJoinRequest = () => {
    // In a real app, this would send a join request
    alert("Join request sent! The organization will review your application.");
  };

  if (!match || !orgId) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <main className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
            <Button onClick={() => setLocation("/leaderboard")}>
              Back to Leaderboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <main className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading organization details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <main className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The organization you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/leaderboard")}>
              Back to Leaderboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const socialMedia = parseSocialMedia(organization.socialMedia);

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <main className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/leaderboard")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main Profile Card */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-4">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={organization.profileImage} alt={organization.name} />
              <AvatarFallback className="text-2xl font-bold">
                {organization.name.split(' ').map((word: string) => word[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <CardTitle className="text-2xl mb-2" data-testid="org-name">
              {organization.name}
            </CardTitle>
            
            <Badge 
              className={`mb-2 ${getGroupTypeColor(organization.groupType)}`}
              data-testid="org-type"
            >
              {organization.groupType}
            </Badge>
            
            <p className="text-muted-foreground" data-testid="org-school">
              {organization.school}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleContactOrganization}
                className="gap-2"
                data-testid="button-contact"
              >
                <MessageSquare className="h-4 w-4" />
                Contact
              </Button>
              <Button 
                variant="outline"
                onClick={handleJoinRequest}
                className="gap-2"
                data-testid="button-join"
              >
                <UserPlus className="h-4 w-4" />
                Request to Join
              </Button>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="org-description">
                {organization.description}
              </p>
            </div>

            <Separator />

            {/* Statistics */}
            <div>
              <h3 className="font-semibold mb-3">Organization Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="font-semibold" data-testid="org-members">
                      {organization.memberCount}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Established</p>
                    <p className="font-semibold" data-testid="org-established">
                      {organization.establishedYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-semibold text-sm truncate" data-testid="org-email">
                      {organization.contactEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            {Object.keys(socialMedia).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Connect With Us</h3>
                  <div className="flex gap-3">
                    {socialMedia.instagram && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        data-testid="social-instagram"
                      >
                        <Instagram className="h-4 w-4" />
                        {socialMedia.instagram}
                      </Button>
                    )}
                    {socialMedia.twitter && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        data-testid="social-twitter"
                      >
                        <Twitter className="h-4 w-4" />
                        {socialMedia.twitter}
                      </Button>
                    )}
                    {socialMedia.website && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        data-testid="social-website"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
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