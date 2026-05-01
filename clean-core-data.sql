-- Clean core registration data only
-- This is safer and faster than cleaning everything

BEGIN;

-- Delete in correct order to respect foreign keys
DELETE FROM business_members;
DELETE FROM businesses;
DELETE FROM tenant_approvals;
DELETE FROM subscriptions;
DELETE FROM tenants;
DELETE FROM users WHERE role = 'business_owner';
DELETE FROM refresh_tokens;
DELETE FROM password_reset_tokens;

-- Verify
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL
SELECT 'businesses', COUNT(*) FROM businesses
UNION ALL
SELECT 'business_members', COUNT(*) FROM business_members
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'tenant_approvals', COUNT(*) FROM tenant_approvals;

COMMIT;
