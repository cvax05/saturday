import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Users, Wine, Clock } from "lucide-react";

interface ProfileCardProps {
  id: string;
  name: string;
  age: number;
  description: string;
  profileImage?: string;
  groupSizeMin: number;
  groupSizeMax: number;
  preferredAlcohol: string;
  availability: string;
  rating: number;
  reviewCount: number;
  city: string;
  onViewProfile: (id: string) => void;
  onMessage: (id: string) => void;
}

export default function ProfileCard({
  id,
  name,
  age,
  description,
  profileImage,
  groupSizeMin,
  groupSizeMax,
  preferredAlcohol,
  availability,
  rating,
  reviewCount,
  city,
  onViewProfile,
  onMessage
}: ProfileCardProps) {
  const handleViewProfile = () => {
    console.log(`Viewing profile for ${name}`);
    onViewProfile(id);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Starting message with ${name}`);
    onMessage(id);
  };

  return (
    <Card 
      className="p-4 hover-elevate cursor-pointer transition-all"
      onClick={handleViewProfile}
      data-testid={`card-profile-${id}`}
    >
      <div className="flex gap-4">
        <Avatar className="h-20 w-20 flex-shrink-0">
          <AvatarImage src={profileImage} alt={name} />
          <AvatarFallback className="text-lg font-semibold">
            {name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-name-${id}`}>
                {name}, {age}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span data-testid={`text-rating-${id}`}>
                  {rating.toFixed(1)} ({reviewCount})
                </span>
                <span className="mx-1">•</span>
                <span>{city}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleMessage}
              data-testid={`button-message-${id}`}
              className="flex-shrink-0"
            >
              Message
            </Button>
          </div>
          
          <p className="text-sm text-foreground mb-3 line-clamp-2" data-testid={`text-description-${id}`}>
            {description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {groupSizeMin}-{groupSizeMax} people
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Wine className="h-3 w-3 mr-1" />
              {preferredAlcohol}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {availability}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}