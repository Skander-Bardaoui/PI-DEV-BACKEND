-- Make ownerId nullable in tenants table to allow deletion flow
ALTER TABLE tenants ALTER COLUMN "ownerId" DROP NOT NULL;
