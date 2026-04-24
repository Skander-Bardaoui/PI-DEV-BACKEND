-- Migration: Add stock_permissions column to business_members table
-- This adds a second permission string for stock management alongside the existing collaboration permissions

-- Step 1: Add the new column with default value
ALTER TABLE business_members 
ADD COLUMN IF NOT EXISTS stock_permissions VARCHAR(6) DEFAULT '------';

-- Step 2: Set role-based default permissions for existing members
-- BUSINESS_OWNER: full access (never editable in UI)
UPDATE business_members 
SET stock_permissions = 'cudakp' 
WHERE role = 'BUSINESS_OWNER';

-- BUSINESS_ADMIN: create, update, delete by default
UPDATE business_members 
SET stock_permissions = 'cud---' 
WHERE role = 'BUSINESS_ADMIN';

-- TEAM_MEMBER: update only by default
UPDATE business_members 
SET stock_permissions = '--u---' 
WHERE role = 'TEAM_MEMBER';

-- ACCOUNTANT: update only by default
UPDATE business_members 
SET stock_permissions = '--u---' 
WHERE role = 'ACCOUNTANT';

-- Verify the migration
SELECT role, permissions, stock_permissions, COUNT(*) as count
FROM business_members
GROUP BY role, permissions, stock_permissions
ORDER BY role;
