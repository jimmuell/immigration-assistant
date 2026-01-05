-- Migration: Add displayName and alternativeDomains to organizations table
-- This enhances the organization matching with name validation

-- Add displayName column for user-friendly display
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add alternativeDomains for firms with multiple domains
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS alternative_domains TEXT[];

-- Update existing organizations to set displayName from name
UPDATE organizations SET display_name = name WHERE display_name IS NULL;

-- Comments
COMMENT ON COLUMN organizations.display_name IS 'User-friendly organization name shown in UI';
COMMENT ON COLUMN organizations.alternative_domains IS 'Array of alternative domain names for the organization';

