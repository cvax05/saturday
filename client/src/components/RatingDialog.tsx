import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pregameId: string;
  revieweeId: string;
  revieweeName: string;
  pregameDate: string;
}

export function RatingDialog({
  open,
  onOpenChange,
  pregameId,
  revieweeId,
  revieweeName,
  pregameDate,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const submitReview = useMutation({
    mutationFn: async (data: { pregameId: string; revieweeId: string; rating: number; message?: string }) => {
      return await apiRequest("/api/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      // Invalidate my reviews (for calendar) and the reviewee's reviews (for their profile)
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/my-reviews'] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/user/${revieweeId}`] });
      onOpenChange(false);
      setRating(0);
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    submitReview.mutate({
      pregameId,
      revieweeId,
      rating,
      message: message.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="rating-dialog">
        <DialogHeader>
          <DialogTitle>Rate Your Pregame</DialogTitle>
          <DialogDescription>
            How was your pregame with {revieweeName} on {pregameDate}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-message">Message (optional)</Label>
            <Textarea
              id="review-message"
              placeholder="Share your experience..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              data-testid="textarea-review-message"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-review"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitReview.isPending}
            data-testid="button-submit-review"
          >
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
