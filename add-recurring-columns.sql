-- Script SQL pour ajouter les colonnes manquantes aux factures récurrentes
-- Exécutez ce script dans pgAdmin ou psql

-- 1. Ajouter la colonne status si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='recurring_invoices' AND column_name='status') THEN
        ALTER TABLE recurring_invoices ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
        
        -- Migrer les données existantes
        UPDATE recurring_invoices 
        SET status = CASE 
            WHEN is_active = true THEN 'ACTIVE' 
            ELSE 'INACTIVE' 
        END;
    END IF;
END $$;

-- 2. Ajouter les colonnes de remise si elles n'existent pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='recurring_invoices' AND column_name='discount_type') THEN
        ALTER TABLE recurring_invoices ADD COLUMN discount_type VARCHAR(20) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='recurring_invoices' AND column_name='discount_value') THEN
        ALTER TABLE recurring_invoices ADD COLUMN discount_value DECIMAL(10,3) DEFAULT NULL;
    END IF;
END $$;

-- 3. Ajouter la FK recurring_invoice_id sur invoices si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='invoices' AND column_name='recurring_invoice_id') THEN
        ALTER TABLE invoices ADD COLUMN recurring_invoice_id UUID DEFAULT NULL;
        
        -- Ajouter la contrainte FK
        ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_recurring_invoice
        FOREIGN KEY (recurring_invoice_id) 
        REFERENCES recurring_invoices(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_status_next_date 
ON recurring_invoices(status, next_invoice_date);

CREATE INDEX IF NOT EXISTS idx_invoices_recurring_invoice_id 
ON invoices(recurring_invoice_id);

-- Afficher un message de confirmation
SELECT 'Migration terminée avec succès!' as message;
