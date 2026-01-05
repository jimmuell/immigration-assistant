-- Migration: Add role column to users table
-- This migration adds role-based authentication support

-- Step 1: Add role column as nullable first
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Step 2: Set default value for existing rows
UPDATE users 
SET role = 'client' 
WHERE role IS NULL;

-- Step 3: Make the column NOT NULL and add constraint
ALTER TABLE users 
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN role SET DEFAULT 'client',
ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'attorney', 'admin'));

-- Step 4: Create an index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
