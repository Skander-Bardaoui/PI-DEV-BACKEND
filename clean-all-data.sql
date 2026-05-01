-- ⚠️ WARNING: This will delete ALL data from the application
-- Use this ONLY in development/testing environments
-- DO NOT run this in production!

-- Disable foreign key checks temporarily (PostgreSQL)
SET session_replication_role = 'replica';

-- Delete all data in reverse order of dependencies
DELETE FROM business_members;
DELETE FROM business_invitations;
DELETE FROM business_settings;
DELETE FROM tax_rates;

-- Delete collaboration data
DELETE FROM subtasks;
DELETE FROM tasks;
DELETE FROM daily_checkins;

-- Delete messages
DELETE FROM messages;

-- Delete stock data
DELETE FROM stock_movements;
DELETE FROM products;
DELETE FROM product_categories;
DELETE FROM warehouses;

-- Delete purchase data
DELETE FROM goods_receipt_items;
DELETE FROM goods_receipts;
DELETE FROM supplier_po_items;
DELETE FROM supplier_pos;
DELETE FROM purchase_invoices;
DELETE FROM purchase_alerts;
DELETE FROM ml_recommendation_actions;
DELETE FROM dispute_responses;
DELETE FROM supplier_portal_tokens;
DELETE FROM suppliers;

-- Delete sales data
DELETE FROM delivery_note_items;
DELETE FROM delivery_notes;
DELETE FROM stock_exit_items;
DELETE FROM stock_exits;
DELETE FROM sales_order_items;
DELETE FROM sales_orders;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM recurring_invoices;
DELETE FROM recurring_subscription_tokens;
DELETE FROM quote_items;
DELETE FROM quotes;
DELETE FROM quote_portal_tokens;
DELETE FROM client_portal_tokens;
DELETE FROM clients;

-- Delete payment data
DELETE FROM transactions;
DELETE FROM supplier_payments;
DELETE FROM salary_proposals;
DELETE FROM payments;
DELETE FROM accounts;

-- Delete audit logs
DELETE FROM audit_logs;

-- Delete platform admin data
DELETE FROM impersonation_logs;
DELETE FROM support_tickets;
DELETE FROM payments; -- platform payments
DELETE FROM subscriptions;
DELETE FROM tenant_approvals;

-- Delete businesses
DELETE FROM businesses;

-- Delete tenants
DELETE FROM tenants;

-- Delete users (including business owners)
DELETE FROM users;

-- Delete refresh tokens
DELETE FROM refresh_tokens;
DELETE FROM password_reset_tokens;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify all tables are empty
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
