-- Migration: Add staff pre-screening setting to organizations
-- This allows solo attorneys to require staff to screen and assign cases before attorneys see them

-- Add require_staff_prescreening column
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS require_staff_prescreening BOOLEAN NOT NULL DEFAULT false;

-- Comment on column for documentation
COMMENT ON COLUMN organizations.require_staff_prescreening IS 
'When true, attorneys in this organization only see screenings assigned to them by staff. 
When false, attorneys see all unassigned screenings (marketplace model). 
Useful for solo attorneys with staff who want to pre-screen cases.';

