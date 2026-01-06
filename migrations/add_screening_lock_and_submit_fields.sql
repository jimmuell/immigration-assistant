-- Migration: Add is_locked and submitted_for_review_at fields to screenings
-- This migration adds fields to support flow submission and edit locking workflow

-- Add is_locked column to track if a screening is locked from editing
ALTER TABLE screenings 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- Add submitted_for_review_at to track when client submitted for attorney review
ALTER TABLE screenings 
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP;

-- Create index for performance when querying locked screenings
CREATE INDEX IF NOT EXISTS screenings_locked_idx ON screenings(is_locked);

-- Comment on columns for documentation
COMMENT ON COLUMN screenings.is_locked IS 'Indicates if the screening is locked from editing (true after submission for review)';
COMMENT ON COLUMN screenings.submitted_for_review_at IS 'Timestamp when the client submitted the screening for attorney review';

