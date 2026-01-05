-- Migration: Add 'staff' role for paralegals and administrative staff
-- This allows solo attorneys to add team members who can help manage the practice

-- Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with 'staff' role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('client', 'attorney', 'org_admin', 'staff', 'super_admin'));

-- Comment for documentation
COMMENT ON COLUMN users.role IS 'User role: client, attorney, org_admin (practice owner), staff (paralegal/secretary), super_admin (platform admin)';

