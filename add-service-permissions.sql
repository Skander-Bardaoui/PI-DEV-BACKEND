-- Migration: Add separate permission keys for services and service categories
-- This adds new keys to the existing stock_permissions JSONB column

-- Update BUSINESS_OWNER members with full service permissions
UPDATE business_members 
SET stock_permissions = stock_permissions || '{
  "create_service": true,
  "update_service": true,
  "delete_service": true,
  "create_service_category": true,
  "update_service_category": true,
  "delete_service_category": true
}'::jsonb
WHERE role = 'BUSINESS_OWNER';

-- Update BUSINESS_ADMIN members with full service permissions
UPDATE business_members 
SET stock_permissions = stock_permissions || '{
  "create_service": true,
  "update_service": true,
  "delete_service": true,
  "create_service_category": true,
  "update_service_category": true,
  "delete_service_category": true
}'::jsonb
WHERE role = 'BUSINESS_ADMIN';

-- Update TEAM_MEMBER and ACCOUNTANT members with limited service permissions
UPDATE business_members 
SET stock_permissions = stock_permissions || '{
  "create_service": false,
  "update_service": true,
  "delete_service": false,
  "create_service_category": false,
  "update_service_category": false,
  "delete_service_category": false
}'::jsonb
WHERE role IN ('TEAM_MEMBER', 'ACCOUNTANT');

-- Verify the migration
SELECT 
  role,
  COUNT(*) as member_count,
  stock_permissions->'create_service' as create_service,
  stock_permissions->'create_service_category' as create_service_category
FROM business_members
GROUP BY role, stock_permissions->'create_service', stock_permissions->'create_service_category'
ORDER BY role;
