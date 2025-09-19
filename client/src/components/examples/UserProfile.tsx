import UserProfile from '../UserProfile';

export default function UserProfileExample() {
  const mockUser = {
    id: "1",
    name: "Alex Johnson",
    age: 24,
    description: "Love meeting new people and exploring the city's nightlife scene. Always down for a fun pregame with good vibes! I enjoy trying new cocktail spots and meeting like-minded people who know how to have a great time.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    groupSizeMin: 4,
    groupSizeMax: 8,
    preferredAlcohol: "Cocktails",
    availability: "Weekends",
    rating: 4.7,
    reviewCount: 23,
    city: "Austin",
    reviews: [
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
      },
      {
        id: "3",
        rating: 5,
        comment: "Super friendly and helped coordinate everything perfectly. Would definitely pregame again!",
        reviewerName: "Emma Wilson",
        date: "2 months ago"
      }
    ]
  };

  return (
    <UserProfile
      {...mockUser}
      onMessage={(id) => console.log('Message user:', id)}
      onBack={() => console.log('Back to feed')}
    />
  );
}