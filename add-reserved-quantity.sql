-- Add reserved_quantity column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reserved_quantity DECIMAL(15,3) DEFAULT 0 NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'reserved_quantity';
