-- Migration: Add website and domain_key to organizations table
-- This enables attorney grouping by firm website domain

-- Add website and domain_key columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS domain_key TEXT;

-- Add unique constraint on domain_key (null values are allowed and not considered duplicates)
ALTER TABLE organizations ADD CONSTRAINT organizations_domain_key_unique UNIQUE (domain_key);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS organizations_domain_key_idx ON organizations(domain_key);

-- Update existing organizations to set domain_key to NULL explicitly if not already set
UPDATE organizations SET domain_key = NULL WHERE domain_key IS NULL;

