-- Migration: Make flows.organization_id nullable for global flows
-- This allows flows to be either global (null) or organization-specific (set)

-- Background:
-- - Super admin creates flows that are visible to ALL clients (global)
-- - organizationId = null means the flow is global
-- - organizationId = set means the flow is organization-specific (future feature)

-- Make organization_id nullable
ALTER TABLE flows 
ALTER COLUMN organization_id DROP NOT NULL;

-- Comment on column for documentation
COMMENT ON COLUMN flows.organization_id IS 'NULL = global flow visible to all clients; Set value = org-specific flow (future feature)';

