-- Create tenant_export_tokens table
CREATE TABLE IF NOT EXISTS tenant_export_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_tenant_export_tokens_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
);

-- Create index on token for fast lookup
CREATE INDEX IF NOT EXISTS idx_tenant_export_tokens_token ON tenant_export_tokens(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_tenant_export_tokens_expires_at ON tenant_export_tokens(expires_at);

-- Create index on tenant_id
CREATE INDEX IF NOT EXISTS idx_tenant_export_tokens_tenant_id ON tenant_export_tokens(tenant_id);
