-- Migration: Add payment_permissions column to business_members table
-- This adds granular payment permissions following the same pattern as collaboration_permissions and stock_permissions

-- Step 1: Add the payment_permissions column
ALTER TABLE business_members
ADD COLUMN IF NOT EXISTS payment_permissions JSONB DEFAULT '{}';

-- Step 2: Set default permissions for BUSINESS_OWNER role
UPDATE business_members 
SET payment_permissions = '{
  "create_client_payment": true,
  "delete_client_payment": true,
  "create_supplier_payment": true,
  "delete_supplier_payment": true,
  "create_schedule": true,
  "update_schedule": true,
  "delete_schedule": true,
  "pay_installment": true,
  "create_account": true,
  "update_account": true,
  "delete_account": true,
  "create_transfer": true,
  "delete_transfer": true
}'::jsonb
WHERE role = 'BUSINESS_OWNER';

-- Step 3: Set default permissions for BUSINESS_ADMIN role
UPDATE business_members 
SET payment_permissions = '{
  "create_client_payment": true,
  "delete_client_payment": false,
  "create_supplier_payment": true,
  "delete_supplier_payment": false,
  "create_schedule": true,
  "update_schedule": true,
  "delete_schedule": false,
  "pay_installment": true,
  "create_account": false,
  "update_account": false,
  "delete_account": false,
  "create_transfer": true,
  "delete_transfer": false
}'::jsonb
WHERE role = 'BUSINESS_ADMIN';

-- Step 4: Set default permissions for TEAM_MEMBER role
UPDATE business_members 
SET payment_permissions = '{
  "create_client_payment": false,
  "delete_client_payment": false,
  "create_supplier_payment": false,
  "delete_supplier_payment": false,
  "create_schedule": false,
  "update_schedule": false,
  "delete_schedule": false,
  "pay_installment": false,
  "create_account": false,
  "update_account": false,
  "delete_account": false,
  "create_transfer": false,
  "delete_transfer": false
}'::jsonb
WHERE role = 'TEAM_MEMBER';

-- Step 5: Set default permissions for ACCOUNTANT role
UPDATE business_members 
SET payment_permissions = '{
  "create_client_payment": true,
  "delete_client_payment": false,
  "create_supplier_payment": true,
  "delete_supplier_payment": false,
  "create_schedule": true,
  "update_schedule": false,
  "delete_schedule": false,
  "pay_installment": true,
  "create_account": false,
  "update_account": false,
  "delete_account": false,
  "create_transfer": false,
  "delete_transfer": false
}'::jsonb
WHERE role = 'ACCOUNTANT';

-- Verification query (optional - comment out if not needed)
-- SELECT role, payment_permissions FROM business_members ORDER BY role;
