-- Create screening_documents table for file uploads related to screenings
CREATE TABLE IF NOT EXISTS screening_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_documents_screening ON screening_documents(screening_id);
CREATE INDEX idx_documents_uploaded_by ON screening_documents(uploaded_by);
CREATE INDEX idx_documents_created_at ON screening_documents(created_at DESC);
