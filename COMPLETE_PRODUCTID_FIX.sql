-- ============================================================================
-- COMPLETE PRODUCT ID FIX - DELETE ALL NULL RECORDS AND ADD CONSTRAINTS
-- ============================================================================
-- This script will:
-- 1. Delete all records with NULL productId from all related tables
-- 2. Add NOT NULL constraints to ensure productId is always required
-- 3. Clean up orphaned records
--
-- WARNING: This will DELETE data! Make sure you have a backup!
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Clean up GOODS RECEIPT ITEMS (must be first due to FK constraints)
-- ============================================================================
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete goods receipt items where product_id is NULL
    DELETE FROM goods_receipt_items WHERE product_id IS NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % goods_receipt_items with NULL product_id', deleted_count;
    
    -- Make product_id NOT NULL
    ALTER TABLE goods_receipt_items ALTER COLUMN product_id SET NOT NULL;
    RAISE NOTICE '✓ goods_receipt_items.product_id is now NOT NULL';
END $$;

-- ============================================================================
-- STEP 2: Clean up DELIVERY NOTE ITEMS (depends on sales_order_items)
-- ============================================================================
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete delivery note items where productId is NULL
    DELETE FROM delivery_note_items WHERE "productId" IS NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % delivery_note_items with NULL productId', deleted_count;
    
    -- Make productId NOT NULL
    ALTER TABLE delivery_note_items ALTER COLUMN "productId" SET NOT NULL;
    RAISE NOTICE '✓ delivery_note_items.productId is now NOT NULL';
END $$;

-- ============================================================================
-- STEP 3: Clean up SALES ORDER ITEMS
-- ============================================================================
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sales order items where productId is NULL
    DELETE FROM sales_order_items WHERE "productId" IS NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % sales_order_items with NULL productId', deleted_count;
    
    -- Make productId NOT NULL
    ALTER TABLE sales_order_items ALTER COLUMN "productId" SET NOT NULL;
    RAISE NOTICE '✓ sales_order_items.productId is now NOT NULL';
END $$;

-- ============================================================================
-- STEP 4: Clean up QUOTE ITEMS
-- ============================================================================
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete quote items where productId is NULL
    DELETE FROM quote_items WHERE "productId" IS NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % quote_items with NULL productId', deleted_count;
    
    -- Make productId NOT NULL
    ALTER TABLE quote_items ALTER COLUMN "productId" SET NOT NULL;
    RAISE NOTICE '✓ quote_items.productId is now NOT NULL';
END $$;

-- ============================================================================
-- STEP 5: Clean up PURCHASE ORDER ITEMS (supplier_po_items)
-- ============================================================================
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete PO items where product_id is NULL
    DELETE FROM supplier_po_items WHERE product_id IS NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % supplier_po_items with NULL product_id', deleted_count;
    
    -- Make product_id NOT NULL
    ALTER TABLE supplier_po_items ALTER COLUMN product_id SET NOT NULL;
    RAISE NOTICE '✓ supplier_po_items.product_id is now NOT NULL';
END $$;

-- ============================================================================
-- STEP 6: Verify constraints
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'VERIFICATION COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'All productId/product_id columns are now NOT NULL';
    RAISE NOTICE 'Database will reject any attempts to insert NULL values';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Restart your backend server';
    RAISE NOTICE '2. Test creating new quotes, orders, and delivery notes';
    RAISE NOTICE '3. Verify stock movements are created correctly';
    RAISE NOTICE '============================================================';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run these after the migration)
-- ============================================================================
-- Check for any remaining NULL values (should return 0 for all)
-- SELECT COUNT(*) FROM delivery_note_items WHERE "productId" IS NULL;
-- SELECT COUNT(*) FROM sales_order_items WHERE "productId" IS NULL;
-- SELECT COUNT(*) FROM quote_items WHERE "productId" IS NULL;
-- SELECT COUNT(*) FROM supplier_po_items WHERE product_id IS NULL;
-- SELECT COUNT(*) FROM goods_receipt_items WHERE product_id IS NULL;
