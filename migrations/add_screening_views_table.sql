-- Add screening_views table to track which attorneys have viewed which screenings
CREATE TABLE IF NOT EXISTS screening_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  attorney_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(screening_id, attorney_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS screening_views_attorney_idx ON screening_views(attorney_id);
CREATE INDEX IF NOT EXISTS screening_views_screening_idx ON screening_views(screening_id);
