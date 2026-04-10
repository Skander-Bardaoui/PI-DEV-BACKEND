-- Check if activity table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'activity'
ORDER BY ordinal_position;

-- Check if there are any activities in the database
SELECT COUNT(*) as total_activities FROM activity;

-- Check activities with details
SELECT 
    a.id,
    a.type,
    a."businessId",
    a."userId",
    a."taskId",
    a."subtaskId",
    a."createdAt",
    u.email as user_email,
    t.title as task_title,
    s.title as subtask_title
FROM activity a
LEFT JOIN "user" u ON a."userId" = u.id
LEFT JOIN task t ON a."taskId" = t.id
LEFT JOIN subtask s ON a."subtaskId" = s.id
ORDER BY a."createdAt" DESC
LIMIT 10;
