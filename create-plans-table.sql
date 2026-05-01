-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_annual DECIMAL(10,2) NOT NULL,
  max_users INTEGER,
  max_businesses INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- Insert default plans
INSERT INTO plans (name, slug, price_monthly, price_annual, max_users, max_businesses, features, is_active)
VALUES 
  (
    'Starter',
    'starter',
    49.000,
    490.000,
    5,
    1,
    '["Gestion des factures", "Gestion des clients", "Tableau de bord basique", "Support par email", "1 utilisateur"]'::jsonb,
    true
  ),
  (
    'Professional',
    'professional',
    99.000,
    990.000,
    15,
    3,
    '["Toutes les fonctionnalités Starter", "Gestion multi-entreprises", "Rapports avancés", "Gestion des stocks", "Intégrations API", "Support prioritaire", "Jusqu''à 15 utilisateurs"]'::jsonb,
    true
  ),
  (
    'Enterprise',
    'enterprise',
    199.000,
    1990.000,
    NULL,
    NULL,
    '["Toutes les fonctionnalités Professional", "Utilisateurs illimités", "Entreprises illimitées", "Prédictions IA", "Support dédié 24/7", "Formation personnalisée", "SLA garanti"]'::jsonb,
    true
  ),
  (
    'Free',
    'free',
    0.000,
    0.000,
    1,
    1,
    '["Fonctionnalités de base", "1 utilisateur", "1 entreprise", "Support communautaire"]'::jsonb,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TND',
  method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(255),
  payer_name VARCHAR(255) NOT NULL,
  payer_phone VARCHAR(50) NOT NULL,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on payments
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_submitted_at ON payments(submitted_at DESC);

-- Add payment_token to subscriptions if it doesn't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_token UUID UNIQUE;

-- Generate payment tokens for existing subscriptions
UPDATE subscriptions 
SET payment_token = uuid_generate_v4() 
WHERE payment_token IS NULL;

-- Update subscription_status enum (if needed)
-- Note: This is a complex operation, you may need to adjust based on your current enum
DO $$ 
BEGIN
  -- Check if the enum values already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending_payment' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
  ) THEN
    ALTER TYPE subscription_status ADD VALUE 'pending_payment';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'payment_submitted' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
  ) THEN
    ALTER TYPE subscription_status ADD VALUE 'payment_submitted';
  END IF;
END $$;

SELECT 'Plans and Payments tables created successfully!' as message;
