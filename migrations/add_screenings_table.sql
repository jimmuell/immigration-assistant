-- Add screenings table
CREATE TABLE IF NOT EXISTS screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
    flow_name TEXT NOT NULL,
    submission_id TEXT NOT NULL,
    responses TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_screenings_user_id ON screenings(user_id);

-- Add index for status lookups
CREATE INDEX IF NOT EXISTS idx_screenings_status ON screenings(status);
