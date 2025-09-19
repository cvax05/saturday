import { useLocation, useParams } from "wouter";
import UserProfile from "@/components/UserProfile";

// TODO: Remove mock data when implementing backend
const mockUsers = [
  {
    id: "1",
    name: "Alex Johnson",
    age: 24,
    description: "Love meeting new people and exploring the city's nightlife scene. Always down for a fun pregame with good vibes!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    groupSizeMin: 4,
    groupSizeMax: 8,
    preferredAlcohol: "Cocktails",
    availability: "Weekends",
    rating: 4.7,
    reviewCount: 23,
    city: "Austin",
    school: "University of Texas at Austin"
  },
  {
    id: "2",
    name: "Sarah Chen",
    age: 26,
    description: "Party photographer and social butterfly! I bring the energy and good music recommendations to every gathering.",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    groupSizeMin: 3,
    groupSizeMax: 6,
    preferredAlcohol: "Wine",
    availability: "Friday nights",
    rating: 4.9,
    reviewCount: 41,
    city: "Austin",
    school: "University of Texas at Austin"
  },
  {
    id: "3",
    name: "Mike Rodriguez",
    age: 22,
    description: "College student who knows all the best spots in town. Let's make some unforgettable memories together!",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    groupSizeMin: 5,
    groupSizeMax: 10,
    preferredAlcohol: "Beer",
    availability: "Most nights",
    rating: 4.5,
    reviewCount: 18,
    city: "Austin",
    school: "University of Texas at Austin"
  }
];

// TODO: Remove mock reviews when implementing backend
const mockReviews = [
  {
    id: "1",
    rating: 5,
    comment: "Amazing energy and super fun to hang out with! Made our pregame unforgettable.",
    reviewerName: "Sarah Chen",
    date: "2 weeks ago"
  },
  {
    id: "2", 
    rating: 4,
    comment: "Great vibes, showed up on time and brought good music recommendations.",
    reviewerName: "Mike Rodriguez",
    date: "1 month ago"
  }
];

export default function UserProfilePage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();

  const user = mockUsers.find(u => u.id === id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Profile not found</h2>
          <button
            onClick={() => setLocation("/home")}
            className="text-primary hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  const handleMessage = (userId: string) => {
    console.log('Starting message with user:', userId);
    setLocation("/messages");
  };

  const handleBack = () => {
    setLocation("/home");
  };

  return (
    <UserProfile
      {...user}
      reviews={mockReviews}
      onMessage={handleMessage}
      onBack={handleBack}
    />
  );
}