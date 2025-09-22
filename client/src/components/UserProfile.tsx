import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, Users, Wine, Clock, MapPin, MessageCircle, Calendar } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  date: string;
}

interface UserProfileProps {
  id: string;
  name: string;
  groupSize: number;
  description: string;
  profileImage?: string;
  groupSizeMin: number;
  groupSizeMax: number;
  preferredAlcohol: string;
  availability: string;
  rating: number;
  reviewCount: number;
  city: string;
  reviews: Review[];
  onMessage: (id: string) => void;
  onConnect?: (id: string) => void;
  onBack: () => void;
  isOwnProfile?: boolean;
}

export default function UserProfile({
  id,
  name,
  groupSize,
  description,
  profileImage,
  groupSizeMin,
  groupSizeMax,
  preferredAlcohol,
  availability,
  rating,
  reviewCount,
  city,
  reviews,
  onMessage,
  onConnect,
  onBack,
  isOwnProfile = false
}: UserProfileProps) {
  const handleMessage = () => {
    console.log(`Starting message with ${name}`);
    onMessage(id);
  };

  const handleConnect = () => {
    console.log(`Connect and pregame with ${name}`);
    onConnect?.(id);
  };

  const handleBack = () => {
    console.log('Navigating back');
    onBack();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={handleBack} data-testid="button-back">
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar className="h-32 w-32 mx-auto sm:mx-0">
              <AvatarImage src={profileImage} alt={name} />
              <AvatarFallback className="text-2xl font-bold">
                {name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl font-bold mb-2" data-testid={`text-name-${id}`}>
                {name}
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                {groupSize} members
              </p>
              
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{city}</span>
              </div>
              
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(rating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold" data-testid={`text-rating-${id}`}>
                  {rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">({reviewCount} reviews)</span>
              </div>
              
              {!isOwnProfile && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={handleMessage} 
                    className="flex-1 sm:flex-none"
                    data-testid={`button-message-${id}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    onClick={handleConnect} 
                    className="flex-1 sm:flex-none"
                    data-testid={`button-connect-${id}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Connect & Pregame
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4" data-testid={`text-description-${id}`}>{description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Group Size</p>
                <p className="text-sm text-muted-foreground">{groupSizeMin}-{groupSizeMax} people</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Prefers</p>
                <p className="text-sm text-muted-foreground">{preferredAlcohol}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Available</p>
                <p className="text-sm text-muted-foreground">{availability}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({reviewCount})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review, index) => (
              <div key={review.id}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {review.reviewerName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{review.reviewerName}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm">{review.comment}</p>
                  </div>
                </div>
                {index < reviews.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}