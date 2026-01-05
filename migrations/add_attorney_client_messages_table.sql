-- Create attorney_client_messages table for direct communication between attorneys and clients
CREATE TABLE IF NOT EXISTS attorney_client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_messages_screening ON attorney_client_messages(screening_id);
CREATE INDEX idx_messages_sender ON attorney_client_messages(sender_id);
CREATE INDEX idx_messages_receiver ON attorney_client_messages(receiver_id);
CREATE INDEX idx_messages_created_at ON attorney_client_messages(created_at DESC);
