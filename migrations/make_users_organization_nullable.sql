-- Migration: Make users.organization_id nullable for client role
-- This allows clients to signup without an organization and get assigned when they accept a quote

-- Background:
-- - Clients have organizationId = null until they accept an attorney's quote
-- - When a client accepts a quote, they get assigned to the attorney's organization
-- - Attorneys, staff, org_admin, and super_admin always have organizationId set

-- Make organization_id nullable
ALTER TABLE users 
ALTER COLUMN organization_id DROP NOT NULL;

-- Set all existing clients to have null organization (unless they've accepted a quote)
-- Note: This is safe because clients should be independent until quote acceptance
UPDATE users 
SET organization_id = NULL 
WHERE role = 'client' 
AND id NOT IN (
  SELECT DISTINCT s.user_id 
  FROM screenings s 
  INNER JOIN quote_requests qr ON qr.screening_id = s.id 
  WHERE qr.status = 'accepted'
);

-- Comment on column for documentation
COMMENT ON COLUMN users.organization_id IS 'NULL for clients until they accept a quote; Set for attorneys/staff/admins to their organization';

