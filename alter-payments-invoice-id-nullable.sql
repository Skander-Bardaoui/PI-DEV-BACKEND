-- Make invoice_id nullable in payments table for subscription payments
ALTER TABLE payments ALTER COLUMN invoice_id DROP NOT NULL;
