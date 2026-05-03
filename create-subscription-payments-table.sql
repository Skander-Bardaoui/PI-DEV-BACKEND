-- Create subscription_payments table
-- This fixes the account_id constraint error by creating a separate table for subscription payments

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL,
    business_id UUID,
    invoice_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    method VARCHAR(20) NOT NULL CHECK (method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'OTHER')),
    reference_number VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    payer_name VARCHAR(255) NOT NULL,
    payer_phone VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
    submitted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_business_id ON subscription_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_submitted_at ON subscription_payments(submitted_at);

-- Add foreign key constraint if subscriptions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        ALTER TABLE subscription_payments 
        ADD CONSTRAINT fk_subscription_payments_subscription_id 
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_payments_updated_at 
    BEFORE UPDATE ON subscription_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'subscription_payments table created successfully' as result;