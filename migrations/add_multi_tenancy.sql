-- Migration: Add multi-tenancy support with organizations
-- This migration creates the organizations table and adds organization_id to existing tables

-- Step 1: Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('law_firm', 'solo_attorney', 'non_legal', 'other')),
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 2: Update users table
-- Add organization_id column and update role enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE users ALTER COLUMN role TYPE TEXT;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'attorney', 'org_admin', 'super_admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS users_organization_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Step 3: Add organization_id to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS conversations_organization_idx ON conversations(organization_id);

-- Step 4: Add organization_id to flows
ALTER TABLE flows ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS flows_organization_idx ON flows(organization_id);

-- Step 5: Add organization_id to screenings
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS screenings_organization_idx ON screenings(organization_id);

-- Step 6: Add organization_id to quote_requests
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS quote_requests_organization_idx ON quote_requests(organization_id);

