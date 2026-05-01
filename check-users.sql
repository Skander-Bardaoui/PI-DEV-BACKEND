-- Check all users
SELECT id, email, role, is_suspended, created_at FROM users ORDER BY created_at DESC;

-- Check all tenants
SELECT id, name, status, "ownerId", created_at FROM tenants ORDER BY created_at DESC;

-- Check all businesses
SELECT id, name, tenant_id, created_at FROM businesses ORDER BY created_at DESC;

-- Check all business members
SELECT id, user_id, business_id, role, is_active FROM business_members ORDER BY created_at DESC;
