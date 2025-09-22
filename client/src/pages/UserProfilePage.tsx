import { useLocation, useParams } from "wouter";
import UserProfile from "@/components/UserProfile";

// TODO: Remove mock data when implementing backend
const mockUsers = [
  {
    id: "1",
    name: "Alpha Sigma Beta",
    groupSize: 24,
    description: "Love meeting new people and exploring the city's nightlife scene. Always down for a fun pregame with good vibes!",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    galleryImages: [
      "https://images.unsplash.com/photo-1574391884720-bbc139ec0bcc?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&h=300&fit=crop&crop=center"
    ],
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
    name: "Delta Phi Sorority",
    groupSize: 32,
    description: "Party photographers and social butterflies! We bring the energy and good music recommendations to every gathering.",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1545987796-200677ee1011?w=300&h=300&fit=crop&crop=center"
    ],
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
    name: "Theta Chi House",
    groupSize: 18,
    description: "College fraternity that knows all the best spots in town. Let's make some unforgettable memories together!",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    galleryImages: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1545987796-200677ee1011?w=300&h=300&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=300&h=300&fit=crop&crop=center"
    ],
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

  const handleConnect = (userId: string) => {
    console.log('Connect and pregame with user:', userId);
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
      onConnect={handleConnect}
      onBack={handleBack}
    />
  );
}