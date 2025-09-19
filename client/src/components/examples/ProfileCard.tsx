import ProfileCard from '../ProfileCard';

export default function ProfileCardExample() {
  const mockUser = {
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
    city: "Austin"
  };

  return (
    <div className="p-4 max-w-md">
      <ProfileCard
        {...mockUser}
        onViewProfile={(id) => console.log('View profile:', id)}
        onMessage={(id) => console.log('Message user:', id)}
      />
    </div>
  );
}