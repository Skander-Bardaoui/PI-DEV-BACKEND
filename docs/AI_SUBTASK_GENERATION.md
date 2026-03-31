# AI Subtask Generation Feature

## Overview
This feature allows users to automatically generate actionable subtasks for their tasks using Groq AI (llama3-8b-8192 model).

## Stack
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + TypeScript + TailwindCSS
- **AI**: Groq API (model: llama-3.3-70b-versatile)

---

## Backend Implementation

### 1. Database Entity
**File**: `src/subtasks/entities/subtask.entity.ts`

Fields:
- `id` (uuid) - Primary key
- `title` (string) - Subtask title
- `isCompleted` (boolean, default: false) - Completion status
- `order` (integer, default: 0) - Display order
- `taskId` (FK → tasks) - Parent task reference with CASCADE delete

### 2. API Endpoints
**Base URL**: `/subtasks`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subtasks/task/:taskId` | Get all subtasks for a task (ordered by `order` ASC) |
| POST | `/subtasks` | Create a subtask manually |
| POST | `/subtasks/generate` | Generate subtask suggestions using Groq AI |
| PATCH | `/subtasks/:id` | Update subtask (toggle completion or rename) |
| DELETE | `/subtasks/:id` | Delete a subtask |

### 3. Groq AI Integration
**Service**: `SubtasksService.generateSubtasks()`

Configuration:
- **URL**: `https://api.groq.com/openai/v1/chat/completions`
- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: 0.7
- **Max Tokens**: 500

The AI generates 5-8 short, actionable subtasks based on:
- Task title
- Task description (required)

Returns: JSON array of strings (subtask titles)

### 4. Environment Variables
Add to `.env`:
```env
GROQ_API_KEY_NOUHA=your_groq_api_key_here
```

---

## Frontend Implementation

### 1. Component: SubtaskList
**File**: `src/components/SubtaskList.tsx`

Features:
- **AI Generation Button**: Triggers Groq API to generate suggestions
- **Loading Spinner**: Shows while generating
- **Preview Box**: Displays AI suggestions with "Accept all" and "Dismiss" buttons
- **Checklist**: Shows existing subtasks with checkboxes and delete icons
- **Progress Bar**: Visual indicator showing completion percentage (e.g., 3/5 = 60%)
- **Manual Input**: Text field to add subtasks manually (press Enter to add)

Props:
```typescript
interface SubtaskListProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
}
```

### 2. Integration
The `SubtaskList` component is integrated into the task edit modal in:
**File**: `src/pages/backoffice/Collaboration.tsx`

The component only appears when editing an existing task (not when creating a new one).

### 3. API Service
**File**: `src/api/subtasks.api.ts`

Provides methods:
- `getByTask(taskId)` - Fetch subtasks
- `create(data)` - Create subtask
- `update(id, data)` - Update subtask
- `delete(id)` - Delete subtask
- `generate(data)` - Generate AI suggestions

---

## Business Rules

1. **Generate Button**: Disabled if task description is empty
2. **Depth Limit**: Max 1 level deep (no subtasks of subtasks)
3. **Cascade Delete**: Subtasks are automatically deleted when parent task is deleted
4. **AI Suggestions**: Generated suggestions are previewed before being saved
5. **Manual Override**: Users can always add/edit/delete subtasks manually

---

## Usage Flow

1. User opens an existing task in edit mode
2. User sees the "Subtasks" section at the bottom of the modal
3. User clicks "✨ Generate with AI" button
4. AI analyzes task title and description
5. AI suggestions appear in a purple preview box
6. User can:
   - Click "Accept all" to add all suggestions
   - Click "Dismiss" to reject suggestions
   - Manually add/edit/delete individual subtasks
7. Progress bar updates as subtasks are completed

---

## Example API Calls

### Generate Subtasks
```bash
POST /subtasks/generate
Content-Type: application/json

{
  "taskId": "uuid-here",
  "taskTitle": "Implement user authentication",
  "taskDescription": "Add JWT-based authentication with login, register, and password reset functionality"
}
```

Response:
```json
[
  "Set up JWT authentication middleware",
  "Create login endpoint with validation",
  "Implement user registration with email verification",
  "Add password reset functionality",
  "Create refresh token mechanism",
  "Add authentication guards to protected routes"
]
```

### Create Subtask
```bash
POST /subtasks
Content-Type: application/json

{
  "title": "Write unit tests",
  "taskId": "uuid-here",
  "order": 0
}
```

### Toggle Completion
```bash
PATCH /subtasks/:id
Content-Type: application/json

{
  "isCompleted": true
}
```

---

## UI Screenshots Description

1. **Generate Button**: Purple gradient button with sparkle icon
2. **AI Suggestions Box**: Purple-themed preview with bullet points
3. **Progress Bar**: Green gradient showing completion percentage
4. **Subtask Items**: Checkbox + title + hover delete icon
5. **Manual Input**: Text field with "Add" button at the bottom

---

## Error Handling

- Missing API key: Returns 400 with message
- Empty description: Button disabled + toast notification
- AI API failure: Shows error toast with details
- Network errors: Graceful fallback with error messages

---

## Future Enhancements

- [ ] Drag-and-drop reordering of subtasks
- [ ] Subtask templates
- [ ] AI learning from user edits
- [ ] Bulk operations (complete all, delete all)
- [ ] Subtask dependencies
- [ ] Time estimates per subtask
