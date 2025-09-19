import { useState } from "react";
import { Button } from "@/components/ui/button";
import RatingModal from '../RatingModal';

export default function RatingModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const mockUser = {
    name: "Sarah Chen",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Open Rating Modal
      </Button>
      
      <RatingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userName={mockUser.name}
        userImage={mockUser.image}
        onSubmitRating={(rating, comment) => {
          console.log('Rating submitted:', { rating, comment });
          alert(`Rating: ${rating} stars\nComment: ${comment}`);
        }}
      />
    </div>
  );
}