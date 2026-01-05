-- Migration: Add attorney ratings system
-- This migration creates the attorney_ratings table for client feedback

CREATE TABLE IF NOT EXISTS attorney_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  screening_id UUID REFERENCES screenings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS attorney_ratings_attorney_idx ON attorney_ratings(attorney_id);
CREATE INDEX IF NOT EXISTS attorney_ratings_client_idx ON attorney_ratings(client_id);

