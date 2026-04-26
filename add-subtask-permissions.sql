-- Migration: Add subtask permissions to collaboration_permissions
-- This adds create_subtask, update_subtask, delete_subtask, and mark_complete_subtask to all existing members

-- Step 1: Update BUSINESS_OWNER - Full subtask permissions
UPDATE business_members SET
  collaboration_permissions = collaboration_permissions || '{
    "create_subtask": true,
    "update_subtask": true,
    "delete_subtask": true,
    "mark_complete_subtask": true
  }'::jsonb
WHERE role = 'BUSINESS_OWNER';

-- Step 2: Update BUSINESS_ADMIN - Full subtask permissions
UPDATE business_members SET
  collaboration_permissions = collaboration_permissions || '{
    "create_subtask": true,
    "update_subtask": true,
    "delete_subtask": true,
    "mark_complete_subtask": true
  }'::jsonb
WHERE role = 'BUSINESS_ADMIN';

-- Step 3: Update TEAM_MEMBER - Can create, update, mark complete, but not delete
UPDATE business_members SET
  collaboration_permissions = collaboration_permissions || '{
    "create_subtask": true,
    "update_subtask": true,
    "delete_subtask": false,
    "mark_complete_subtask": true
  }'::jsonb
WHERE role = 'TEAM_MEMBER';

-- Step 4: Update ACCOUNTANT - Can create, update, mark complete, but not delete
UPDATE business_members SET
  collaboration_permissions = collaboration_permissions || '{
    "create_subtask": true,
    "update_subtask": true,
    "delete_subtask": false,
    "mark_complete_subtask": true
  }'::jsonb
WHERE role = 'ACCOUNTANT';

-- Step 5: Verify the migration
SELECT 
  role,
  collaboration_permissions->'create_subtask' as create_subtask,
  collaboration_permissions->'update_subtask' as update_subtask,
  collaboration_permissions->'delete_subtask' as delete_subtask,
  collaboration_permissions->'mark_complete_subtask' as mark_complete_subtask,
  COUNT(*) as count
FROM business_members
GROUP BY role, 
  collaboration_permissions->'create_subtask', 
  collaboration_permissions->'update_subtask', 
  collaboration_permissions->'delete_subtask',
  collaboration_permissions->'mark_complete_subtask'
ORDER BY role;
