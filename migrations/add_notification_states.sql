-- Create notification_states table to track read/unread and dismissed notifications
CREATE TABLE IF NOT EXISTS notification_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL, -- Composite ID like "quote-{screeningId}"
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- Add index for performance
CREATE INDEX notification_states_user_idx ON notification_states(user_id);
CREATE INDEX notification_states_user_dismissed_idx ON notification_states(user_id, is_dismissed);

-- Add comment
COMMENT ON TABLE notification_states IS 'Tracks read/unread and dismissed state for user notifications';

