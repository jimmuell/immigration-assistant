-- Migration: Remove duplicate "Platform Administration" organizations
-- This script keeps the oldest Platform Administration organization and removes duplicates
-- It also reassigns any users from duplicate orgs to the primary one

-- Step 1: Find the oldest Platform Administration organization (the one to keep)
WITH primary_org AS (
  SELECT id, name, created_at
  FROM organizations
  WHERE name = 'Platform Administration'
  ORDER BY created_at ASC
  LIMIT 1
),
-- Step 2: Find all duplicate Platform Administration organizations
duplicate_orgs AS (
  SELECT o.id
  FROM organizations o
  WHERE o.name = 'Platform Administration'
    AND o.id NOT IN (SELECT id FROM primary_org)
)
-- Step 3: Update all users in duplicate orgs to point to the primary org
UPDATE users
SET organization_id = (SELECT id FROM primary_org)
WHERE organization_id IN (SELECT id FROM duplicate_orgs);

-- Step 4: Delete the duplicate organizations (cascade will handle related records)
DELETE FROM organizations
WHERE id IN (
  SELECT o.id
  FROM organizations o
  WHERE o.name = 'Platform Administration'
    AND o.id NOT IN (
      SELECT id FROM organizations
      WHERE name = 'Platform Administration'
      ORDER BY created_at ASC
      LIMIT 1
    )
);

-- Verify the result: Should only have one Platform Administration org now
SELECT COUNT(*) as platform_admin_count
FROM organizations
WHERE name = 'Platform Administration';

