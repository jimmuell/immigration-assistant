-- Migration: Add attorney profiles table
-- This migration creates the attorney_profiles table for enhanced attorney information

CREATE TABLE IF NOT EXISTS attorney_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[],
  years_of_experience INTEGER,
  bar_number TEXT,
  bar_state TEXT,
  rating REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS attorney_profiles_organization_idx ON attorney_profiles(organization_id);
CREATE INDEX IF NOT EXISTS attorney_profiles_user_idx ON attorney_profiles(user_id);

