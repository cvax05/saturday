import MessageList from '../MessageList';

export default function MessageListExample() {
  const mockConversations = [
    {
      id: "1",
      participantName: "Sarah Chen",
      participantImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      lastMessage: "Sounds great! What time should we meet up?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 2,
      hasUnreadPendingRating: false
    },
    {
      id: "2", 
      participantName: "Mike Rodriguez",
      participantImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      lastMessage: "Thanks for the great pregame last night!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      unreadCount: 0,
      hasUnreadPendingRating: true
    },
    {
      id: "3",
      participantName: "Emma Wilson", 
      participantImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      lastMessage: "Hey! I saw your profile and would love to connect",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      unreadCount: 1,
      hasUnreadPendingRating: false
    }
  ];

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-xl font-bold mb-4">Messages</h2>
      <MessageList
        conversations={mockConversations}
        onConversationClick={(id) => console.log('Open conversation:', id)}
      />
    </div>
  );
}