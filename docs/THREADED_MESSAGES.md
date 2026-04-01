# Threaded Messages (Reply to Message) — Like Slack

## Overview
This feature implements Slack-like threaded messages with 1 level deep replies. Users can reply to any message, and all replies are displayed in a dedicated thread panel.

## Stack
- Backend: NestJS + TypeORM + PostgreSQL + Socket.IO
- Frontend: React + TypeScript + TailwindCSS
- Chat component: TaskChat.tsx
- Thread component: ThreadPanel.tsx

---

## Backend Implementation

### 1. Database Schema

#### Message Entity
Added two new fields to the `Message` entity:

```typescript
@Column({ nullable: true })
parentMessageId: string;

@ManyToOne(() => Message, { onDelete: 'CASCADE', nullable: true })
@JoinColumn({ name: 'parentMessageId' })
parentMessage: Message;

@Column({ type: 'int', default: 0 })
replyCount: number;
```

- `parentMessageId`: Foreign key to the parent message (nullable)
- `parentMessage`: Relation to the parent message with CASCADE delete
- `replyCount`: Counter for the number of replies (default 0)

#### Migration
Created migration `1743360000000-AddThreadingToMessages.ts` to:
- Add `parentMessageId` column (uuid, nullable)
- Add `replyCount` column (integer, default 0)
- Add foreign key constraint with CASCADE delete

### 2. DTO Updates

#### CreateMessageDto
Added optional field:
```typescript
@IsUUID()
@IsOptional()
parentMessageId?: string; // For threaded replies
```

### 3. Service Methods

#### MessagesService

**create()** - Enhanced to handle replies:
- Validates parent message exists if `parentMessageId` is provided
- Increments parent's `replyCount` using `messageRepository.increment()`
- Creates message with `parentMessageId` field

**findAllByTask()** - Modified to return only top-level messages:
```typescript
where: { taskId, parentMessageId: IsNull() }
```

**New Methods:**
- `findThreadReplies(parentMessageId)`: Returns all replies for a message
- `findMessageById(messageId)`: Returns a single message with sender relation

### 4. Controller Endpoints

#### POST /messages
- Accepts optional `parentMessageId` in body
- If reply: emits `newReply` WebSocket event
- If regular message: emits `newMessage` WebSocket event

#### GET /messages/task/:taskId
- Returns only top-level messages (no replies)

#### GET /messages/thread/:parentMessageId
- Returns parent message and all its replies
- Response format:
```json
{
  "parentMessage": { ... },
  "replies": [ ... ]
}
```

### 5. WebSocket Events

#### newReply
Emitted when a reply is created:
```typescript
{
  reply: Message,
  parentMessageId: string,
  newReplyCount: number
}
```

---

## Frontend Implementation

### 1. TaskChat Component Updates

#### New State Variables
```typescript
const [replyingTo, setReplyingTo] = useState<Message | null>(null);
const [openThread, setOpenThread] = useState<Message | null>(null);
const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
```

#### Message Interface
Added fields:
```typescript
parentMessageId?: string;
replyCount?: number;
```

#### Reply Button
- Shows on message hover
- Clicking sets `replyingTo` state
- Displays reply preview bar above input

#### Reply Preview Bar
Shows when replying:
- Displays parent message sender and content
- Has close button to cancel reply
- Styled with indigo colors

#### Thread View Button
Shows when message has replies:
- Displays reply count: "X réponse(s) · Voir le fil"
- Clicking opens ThreadPanel

#### Socket Listener
Listens to `newReply` event:
- Updates `replyCount` of parent message in real-time

#### Send Message
- Includes `parentMessageId` in FormData if replying
- Clears `replyingTo` state after sending

### 2. ThreadPanel Component

#### Features
- Side panel (500px width) on the right
- Shows original message at top
- Lists all replies below
- Has its own message input
- Supports @mentions and file attachments
- Real-time updates via WebSocket

#### Layout
1. **Header**: Title "Fil de discussion" with reply count
2. **Original Message**: Parent message with full content
3. **Replies List**: Scrollable list of replies
4. **Input Area**: Reply input with file/mention buttons

#### Socket Integration
- Shares same socket connection as main chat
- Listens to `newReply` event
- Adds new replies to list in real-time

#### API Calls
- Fetches thread on mount: `GET /messages/thread/:parentMessageId`
- Sends replies: `POST /messages` with `parentMessageId`

---

## User Experience

### Replying to a Message
1. Hover over any message
2. Click the Reply button (↩️ icon)
3. Reply preview bar appears above input
4. Type message and send
5. Reply is added to thread

### Viewing a Thread
1. Click "X réponse(s) · Voir le fil" button
2. Thread panel slides in from right
3. See original message and all replies
4. Can reply directly from thread panel

### Real-time Updates
- When someone replies, reply count updates instantly
- New replies appear in thread panel automatically
- Works for all users viewing the same task

---

## Rules & Constraints

1. **Max 1 Level Deep**: No reply to a reply (enforced by UI)
2. **Shared Socket**: Thread panel uses same socket as main chat
3. **Cascade Delete**: Deleting parent message deletes all replies
4. **Top-level Only**: Main chat shows only top-level messages
5. **Reply Support**: Replies support @mentions and file attachments

---

## Files Modified/Created

### Backend
- `src/messages/entities/message.entity.ts` - Added threading fields
- `src/messages/dto/create-message.dto.ts` - Added parentMessageId
- `src/messages/messages.service.ts` - Added thread methods
- `src/messages/messages.controller.ts` - Added thread endpoint
- `src/migrations/1743360000000-AddThreadingToMessages.ts` - Migration

### Frontend
- `src/components/TaskChat.tsx` - Added reply functionality
- `src/components/ThreadPanel.tsx` - New thread panel component

### Documentation
- `docs/THREADED_MESSAGES.md` - This file

---

## Testing

### Manual Testing Steps

1. **Create a Reply**:
   - Open task chat
   - Hover over a message
   - Click Reply button
   - Type and send reply
   - Verify reply count appears

2. **View Thread**:
   - Click "Voir le fil" button
   - Verify thread panel opens
   - Verify original message and replies show
   - Close panel

3. **Reply from Thread**:
   - Open thread panel
   - Type and send reply
   - Verify reply appears in thread
   - Verify reply count updates in main chat

4. **Real-time Updates**:
   - Open same task in two browsers
   - Reply from one browser
   - Verify reply count updates in other browser
   - Open thread in second browser
   - Verify reply appears

5. **File Attachments**:
   - Reply with file attachment
   - Verify file shows in thread

6. **Mentions**:
   - Reply with @mention
   - Verify mention works in thread

---

## Future Enhancements

- Notifications for replies to your messages
- Unread reply indicators
- Thread preview in main chat (first reply)
- Search within threads
- Thread bookmarking
- Reply reactions
