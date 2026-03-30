-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_warehouses_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_business_id ON warehouses(business_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_business_id_is_active ON warehouses(business_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_business_id_code ON warehouses(business_id, code);

-- Add warehouse_id to products table (check if column exists first)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='products' AND column_name='warehouse_id') THEN
        ALTER TABLE products ADD COLUMN warehouse_id UUID;
        ALTER TABLE products ADD CONSTRAINT fk_products_warehouse 
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add warehouse_id to stock_movements table (check if column exists first)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stock_movements' AND column_name='warehouse_id') THEN
        ALTER TABLE stock_movements ADD COLUMN warehouse_id UUID;
        ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_warehouse 
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL;
    END IF;
END $$;
