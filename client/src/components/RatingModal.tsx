import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userImage?: string;
  onSubmitRating: (rating: number, comment: string) => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  userName,
  userImage,
  onSubmitRating
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleSubmit = () => {
    // Only submit if user has provided some input
    if (rating > 0 || comment.trim().length > 0) {
      console.log(`Rating submitted: ${rating} stars for ${userName}`);
      console.log(`Comment: ${comment}`);
      onSubmitRating(rating, comment);
    }
    
    // Reset form
    setRating(0);
    setComment("");
    onClose();
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
    console.log(`Selected ${starRating} stars for ${userName}`);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-rating">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userImage} alt={userName || 'User'} />
              <AvatarFallback>
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{userName || 'User'}</p>
              <p className="text-sm text-muted-foreground">How was your pregame experience?</p>
            </div>
          </div>

          <div className="text-center">
            <p className="mb-3 font-medium">Rate your experience</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="p-1 transition-transform hover:scale-110"
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Tell us about your experience (optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Share details about your pregame experience with this person..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-comment"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
            <p className="text-sm text-primary font-medium mb-1">💭 Completely Optional</p>
            <p className="text-sm">
              Rating is optional! You can skip this entirely or share your experience to help others.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              data-testid="button-skip"
            >
              Skip Rating
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              data-testid="button-submit"
            >
              {rating > 0 || comment.trim() ? 'Submit Rating' : 'Continue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}