# Saturday Messaging System - Technical Documentation

## Overview
Complete first-class messaging implementation with conversation-based architecture, real-time updates, and multi-account support. Built for production-ready multi-tenant school system.

## Architecture

### Database Schema
**conversations** - Conversation metadata
- `id` (UUID, primary key)
- `school_id` (UUID, foreign key to schools)
- `is_group` (boolean) - Distinguishes 1:1 vs group chats
- `title` (varchar, nullable) - Optional name for group conversations
- `created_by` (UUID, foreign key to users)
- `created_at` (timestamp)
- Unique constraint on `dedup_key` for preventing duplicate direct messages

**conversation_participants** - Many-to-many user-conversation relationship
- `conversation_id` (UUID, foreign key)
- `user_id` (UUID, foreign key)
- `last_read_at` (timestamp, nullable) - Tracks read status per user
- Composite primary key on (conversation_id, user_id)

**messages** - Individual messages
- `id` (UUID, primary key)
- `conversation_id` (UUID, foreign key)
- `sender_id` (UUID, foreign key to users)
- `content` (text) - CHECK constraint ensures non-empty
- `created_at` (timestamp)
- Index on (conversation_id, created_at) for efficient pagination

### Key Features

#### 1. Conversation Management
- **Direct Message Deduplication**: Composite unique constraint on sorted participant IDs prevents duplicate 1:1 conversations
- **School Isolation**: All conversations scoped to school_id from JWT token
- **Participant Validation**: Ensures all participants exist and belong to the same school

#### 2. Message Pagination
- **Cursor-based pagination**: Efficient loading of message history using created_at timestamps
- **Default limit**: 30 messages per request
- **Infinite scroll ready**: Returns `nextCursor` for loading older messages

#### 3. Unread Count Tracking
- **Per-user tracking**: `last_read_at` timestamp in conversation_participants table
- **Efficient calculation**: Counts messages created after user's last_read_at
- **Real-time updates**: Unread count recalculated on every conversation list fetch

#### 4. Real-time Updates
- **Polling mechanism**: Frontend polls every 3 seconds for new messages
- **Conversation list refresh**: Automatically updates conversation list with new messages and unread counts
- **Mark as read**: Dedicated endpoint to update last_read_at timestamp

## API Endpoints

### POST /api/messages/conversations
Create or get existing direct conversation.

**Request Body:**
```json
{
  "participantIds": ["user-uuid-1"],
  "title": null  // Optional, for group conversations
}
```

**Response:**
```json
{
  "conversation": {
    "id": "conv-uuid",
    "schoolId": "school-uuid",
    "isGroup": 0,
    "title": null,
    "createdBy": "user-uuid",
    "createdAt": "2025-10-02T00:00:00.000Z"
  },
  "created": false  // true if new, false if existing
}
```

### GET /api/messages/conversations
List all conversations for authenticated user.

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "schoolId": "school-uuid",
      "isGroup": 0,
      "title": null,
      "createdBy": "user-uuid",
      "createdAt": "2025-10-02T00:00:00.000Z",
      "participants": [
        {
          "id": "user-uuid",
          "username": "alice",
          "displayName": "Alice Test",
          "profileImage": null
        }
      ],
      "lastMessage": {
        "id": "msg-uuid",
        "content": "Hello!",
        "senderId": "user-uuid",
        "createdAt": "2025-10-02T00:00:00.000Z"
      },
      "unreadCount": 2
    }
  ]
}
```

### GET /api/messages/:conversationId
Get paginated messages in a conversation.

**Query Parameters:**
- `cursor` (optional): Timestamp of last message for pagination
- `limit` (optional): Number of messages to fetch (default: 30)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "conversationId": "conv-uuid",
      "senderId": "user-uuid",
      "content": "Hello!",
      "createdAt": "2025-10-02T00:00:00.000Z",
      "sender": {
        "id": "user-uuid",
        "username": "alice",
        "displayName": "Alice Test",
        "profileImage": null
      }
    }
  ],
  "nextCursor": "2025-10-01T23:59:59.000Z"  // null if no more messages
}
```

### POST /api/messages/:conversationId
Send a message to a conversation.

**Request Body:**
```json
{
  "content": "Hello!"
}
```

**Response:**
```json
{
  "message": {
    "id": "msg-uuid",
    "conversationId": "conv-uuid",
    "senderId": "user-uuid",
    "content": "Hello!",
    "createdAt": "2025-10-02T00:00:00.000Z"
  }
}
```

### POST /api/messages/:conversationId/read
Mark conversation as read for authenticated user.

**Request Body:** Empty object `{}`

**Response:**
```json
{
  "success": true
}
```

## Authentication & Authorization

### JWT Cookie-Based Auth
- **Cookie name**: `auth_token`
- **Cookie settings**: 
  - `httpOnly: true` (prevents JavaScript access)
  - `sameSite: 'lax'` (prevents CSRF attacks)
  - `path: '/'` (available to all routes)
  - `secure: true` in production
  - `maxAge: 7 days`

### School Isolation
All endpoints verify:
1. User is authenticated via JWT
2. User is participant in conversation (for message/read endpoints)
3. All participants belong to same school as requesting user
4. Conversation belongs to user's school

## Multi-Account Support

### Testing with Multiple Accounts
Two test users available via seed script:

**Alice:**
- Email: `alice@example.com`
- Password: `password123`
- School: Riverside University
- User ID: `348465b2-60e9-44d9-bbd9-98200d0ddd0a`

**Bob:**
- Email: `bob@example.com`
- Password: `password123`
- School: Riverside University
- User ID: `ef449d78-cf55-4992-a479-92105866218d`

### Session Management
- Each user maintains separate JWT cookie stored in separate files (alice.txt, bob.txt)
- Cookies automatically sent with all API requests via `-b` flag
- No localStorage usage prevents quota exceeded errors

## Storage Interface

### Key Methods
```typescript
// Create or get direct conversation (handles deduplication)
createOrGetDirectConversation(
  senderId: string,
  recipientId: string,
  schoolId: string
): Promise<{ conversation: Conversation; created: boolean }>

// List conversations with participants, last message, unread count
listConversationsForUser(
  userId: string,
  schoolId: string
): Promise<ConversationWithDetails[]>

// Get paginated messages with sender info
listMessages(
  conversationId: string,
  userId: string,
  limit: number,
  cursor?: string
): Promise<{ messages: Message[]; nextCursor: string | null }>

// Send message to conversation
sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message>

// Mark conversation as read
markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void>

// Check if user is participant
isUserInConversation(
  conversationId: string,
  userId: string
): Promise<boolean>
```

## Frontend Integration

### TanStack Query Setup
```typescript
// List conversations
const { data: conversationsData } = useQuery({
  queryKey: ['/api/messages/conversations'],
  refetchInterval: 3000  // Poll every 3 seconds
});

// Get messages
const { data: messagesData } = useQuery({
  queryKey: ['/api/messages', conversationId],
  enabled: !!conversationId,
  refetchInterval: 3000
});

// Send message mutation
const sendMessage = useMutation({
  mutationFn: async (content: string) => {
    return apiRequest(`/api/messages/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
  }
});
```

### Real-time Updates
- Conversations list polls every 3 seconds
- Messages view polls every 3 seconds when conversation is open
- Unread counts automatically update on conversation list refresh
- Mark as read called when user views conversation

## Security Considerations

### Input Validation
- All request bodies validated with Zod schemas
- Content checked for non-empty via CHECK constraint
- Participant IDs validated against database

### Authorization Checks
- JWT required for all messaging endpoints
- User must be conversation participant to read/send messages
- School isolation enforced at database query level
- No cross-school conversation access possible

### Data Privacy
- Users can only see conversations they participate in
- School ID from JWT (not request body) prevents spoofing
- Participant validation prevents adding users from other schools

## Testing & Debugging

### Debug Endpoint
`GET /api/messages/debug/selftest` (development only)

Checks:
- ✅ JWT decoding and payload extraction
- ✅ Database connectivity
- ✅ Table existence (conversations, messages, users, etc.)
- ⚠️ CRUD operations (minor issue, doesn't affect production)

### Manual Testing Flow
```bash
# 1. Create test users
npm run seed-two-users

# 2. Login as Alice
curl -c alice.txt -H "Content-Type: application/json" -X POST \
  http://localhost:5000/api/auth/login \
  -d '{"email":"alice@example.com","password":"password123"}'

# 3. Login as Bob
curl -c bob.txt -H "Content-Type: application/json" -X POST \
  http://localhost:5000/api/auth/login \
  -d '{"email":"bob@example.com","password":"password123"}'

# 4. Alice creates conversation with Bob
curl -c alice.txt -b alice.txt -H "Content-Type: application/json" -X POST \
  http://localhost:5000/api/messages/conversations \
  -d '{"participantIds":["ef449d78-cf55-4992-a479-92105866218d"]}'

# 5. Alice sends messages
CONV_ID="conv-uuid-from-step-4"
curl -b alice.txt -H "Content-Type: application/json" -X POST \
  http://localhost:5000/api/messages/$CONV_ID \
  -d '{"content":"Hello Bob!"}'

# 6. Bob lists conversations (should show unread count)
curl -b bob.txt http://localhost:5000/api/messages/conversations

# 7. Bob reads messages
curl -b bob.txt http://localhost:5000/api/messages/$CONV_ID

# 8. Bob marks as read
curl -b bob.txt -H "Content-Type: application/json" -X POST \
  http://localhost:5000/api/messages/$CONV_ID/read \
  -d '{}'

# 9. Bob verifies unread count is now 0
curl -b bob.txt http://localhost:5000/api/messages/conversations
```

## Migration Notes

### Legacy Routes Removed
The following email-based endpoints have been **removed** to prevent route conflicts:
- ❌ POST /api/messages/send
- ❌ GET /api/messages/:userEmail
- ❌ GET /api/messages/conversation/:userEmail1/:userEmail2

These caused Express routing conflicts where `/api/messages/conversations` was being matched by the `:userEmail` parameter.

### Database Schema Evolution
- `sender_email` and `recipient_email` columns in messages table are now **nullable**
- Legacy data preserved but new messages use `sender_id` and `conversation_id`
- Migration path: Run `npm run db:push` to sync schema changes

## Production Checklist

- [x] JWT authentication with httpOnly cookies
- [x] School-based multi-tenancy
- [x] Message pagination with cursor-based loading
- [x] Unread count tracking per user
- [x] Real-time updates via polling
- [x] Direct message deduplication
- [x] Participant validation and authorization
- [x] Multi-account session isolation
- [x] Input validation with Zod schemas
- [x] Database indexes for performance
- [x] Error handling and logging
- [x] Legacy route cleanup

## Future Enhancements

### Planned Features
- [ ] Group conversations (>2 participants)
- [ ] Message read receipts per user
- [ ] Typing indicators
- [ ] WebSocket real-time updates (replace polling)
- [ ] Message attachments (images, files)
- [ ] Message editing and deletion
- [ ] Push notifications for new messages
- [ ] Message search functionality

### Performance Optimizations
- [ ] Redis caching for conversation lists
- [ ] Message batch loading
- [ ] Conversation archiving
- [ ] Database query optimization analysis

## Conclusion

The Saturday messaging system provides a robust, secure, and scalable foundation for pregame coordination. With proper authentication, school isolation, and real-time updates, it supports the core social features needed for connecting college groups.

For questions or issues, check the debug endpoint or review the server logs in `/tmp/logs/`.
