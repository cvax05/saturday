import DiscoverFeed from '../DiscoverFeed';

export default function DiscoverFeedExample() {
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
      city: "Austin"
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
      city: "Austin"
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
      city: "Austin"
    }
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <DiscoverFeed
        users={mockUsers}
        onViewProfile={(id) => console.log('View profile:', id)}
        onMessage={(id) => console.log('Message user:', id)}
        onRefresh={() => console.log('Refreshing feed...')}
      />
    </div>
  );
}