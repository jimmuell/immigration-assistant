-- Create quote_requests table for attorney quotes to clients
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  attorney_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  notes TEXT,
  expires_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT quote_requests_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Add indexes for faster queries
CREATE INDEX idx_quotes_screening ON quote_requests(screening_id);
CREATE INDEX idx_quotes_attorney ON quote_requests(attorney_id);
CREATE INDEX idx_quotes_status ON quote_requests(status);
CREATE INDEX idx_quotes_created_at ON quote_requests(created_at DESC);
