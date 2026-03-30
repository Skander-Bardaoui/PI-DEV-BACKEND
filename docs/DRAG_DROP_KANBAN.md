# Drag & Drop Kanban Board Implementation

## Overview
Full drag-and-drop functionality for the Kanban board with real-time WebSocket updates.

## Features Implemented

### Backend

#### 1. Database Changes
- Added `order` column (integer) to `Task` entity
- Migration file: `1743350000000-AddOrderToTasks.ts`
- Initializes order based on creation date within each status group

#### 2. New Endpoint
**PATCH /tasks/:id/move**
- Updates task status AND order in one atomic operation
- Reorders other tasks in affected columns automatically
- Uses database transactions for data consistency

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "order": 2
}
```

#### 3. Service Updates
- `TasksService.moveTask()` - Handles complex reordering logic
- Supports both cross-column moves and same-column reordering
- Atomic transactions ensure data integrity

#### 4. WebSocket Events
- Added `taskMoved` event to `MessagesGateway`
- Broadcasts task movements to all users in the business
- Payload includes: taskId, newStatus, newOrder, movedBy

**New WebSocket Events:**
- `joinBusiness` - Join business room for updates
- `leaveBusiness` - Leave business room
- `taskMoved` - Emitted when task is moved

### Frontend

#### 1. Dependencies
- `@dnd-kit/core` - Core drag and drop functionality
- `@dnd-kit/sortable` - Sortable list support
- `@dnd-kit/utilities` - Helper utilities

#### 2. New Components

**DraggableTaskCard.tsx**
- Wraps task card with drag functionality
- Shows drag handle (⠿) on hover
- Visual feedback during drag (scale, opacity, rotation)

**DroppableColumn.tsx**
- Makes columns droppable zones
- Highlights when dragging over
- Uses SortableContext for sortable items

#### 3. Collaboration.tsx Updates
- Wrapped Kanban board with `<DndContext>`
- Implemented drag handlers:
  - `handleDragStart` - Captures dragged task
  - `handleDragOver` - Optimistic UI updates
  - `handleDragEnd` - API call to persist changes
- WebSocket connection for real-time updates
- Rollback on API errors

## Usage

### Dragging Tasks
1. Hover over a task card to see the drag handle (⠿)
2. Click and drag the task to a new position
3. Drop in a different column to change status
4. Drop within the same column to reorder

### Visual Feedback
- **Dragging**: Card scales up, becomes semi-transparent, rotates slightly
- **Drop Zone**: Column highlights with indigo border when hovering
- **Drag Overlay**: Shows dragged card following cursor

### Real-time Updates
- Other users see task movements instantly via WebSocket
- No page refresh needed
- Optimistic UI updates for smooth experience

## Permissions
- Only `BUSINESS_OWNER` and `BUSINESS_ADMIN` can drag tasks
- Other users see read-only board

## Error Handling
- Failed moves trigger toast error notification
- UI rolls back to previous state on error
- Tasks reload from server to ensure consistency

## Database Migration

Run the migration to add the order column:

```bash
# Development
npm run migration:run

# Production
npm run migration:run:prod
```

The migration will:
1. Add `order` column with default value 0
2. Initialize order based on `createdAt` within each status group
3. Ensure existing tasks have proper ordering

## API Examples

### Move Task to Different Column
```bash
curl -X PATCH http://localhost:3001/tasks/task-id/move \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE", "order": 0}'
```

### Reorder Within Same Column
```bash
curl -X PATCH http://localhost:3001/tasks/task-id/move \
  -H "Content-Type: application/json" \
  -d '{"status": "TODO", "order": 3}'
```

## WebSocket Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  withCredentials: true,
});

// Join business room
socket.emit('joinBusiness', businessId);

// Listen for task movements
socket.on('taskMoved', (data) => {
  console.log('Task moved:', data);
  // Update UI
});
```

## Performance Considerations

1. **Optimistic Updates**: UI updates immediately before API call
2. **Debouncing**: Drag events are throttled to prevent excessive updates
3. **Transactions**: Database operations are atomic
4. **WebSocket**: Real-time updates without polling

## Future Enhancements

- [ ] Drag & drop file upload in chat
- [ ] Skeleton loader during reordering
- [ ] Undo/redo functionality
- [ ] Bulk task operations
- [ ] Keyboard shortcuts for task movement
- [ ] Touch device support improvements

## Troubleshooting

### Tasks not reordering
- Check browser console for errors
- Verify WebSocket connection is established
- Ensure user has proper permissions

### Order numbers inconsistent
- Run migration again to reset order values
- Check for failed transactions in logs

### Real-time updates not working
- Verify WebSocket server is running
- Check CORS configuration
- Ensure user joined business room
