import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isFromUser: boolean;
}

interface Conversation {
  id: string;
  participantName: string;
  participantImage?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  hasUnreadPendingRating?: boolean;
}

interface MessageListProps {
  conversations: Conversation[];
  onConversationClick: (conversationId: string) => void;
}

export default function MessageList({ conversations, onConversationClick }: MessageListProps) {
  const handleConversationClick = (conversationId: string) => {
    console.log(`Opening conversation: ${conversationId}`);
    onConversationClick(conversationId);
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-4xl">💬</div>
        <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start connecting with people to see your conversations here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className="p-4 hover-elevate cursor-pointer transition-all"
          onClick={() => handleConversationClick(conversation.id)}
          data-testid={`card-conversation-${conversation.id}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.participantImage} alt={conversation.participantName} />
                <AvatarFallback>
                  {conversation.participantName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {conversation.unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs justify-center p-0 bg-primary"
                  data-testid={`badge-unread-${conversation.id}`}
                >
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold truncate" data-testid={`text-name-${conversation.id}`}>
                  {conversation.participantName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(conversation.lastMessageTime, { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p 
                  className={`text-sm truncate ${
                    conversation.unreadCount > 0 ? 'font-medium' : 'text-muted-foreground'
                  }`}
                  data-testid={`text-last-message-${conversation.id}`}
                >
                  {conversation.lastMessage}
                </p>
                
                {conversation.hasUnreadPendingRating && (
                  <Badge variant="destructive" className="text-xs ml-2 flex-shrink-0">
                    Rating Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}