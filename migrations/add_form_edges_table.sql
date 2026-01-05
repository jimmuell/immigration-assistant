-- Add form_edges table for visual flow editor
CREATE TABLE IF NOT EXISTS form_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by flow_id
CREATE INDEX IF NOT EXISTS idx_form_edges_flow_id ON form_edges(flow_id);

-- Create index for edge_id lookups within a flow
CREATE INDEX IF NOT EXISTS idx_form_edges_edge_id ON form_edges(edge_id);

-- Create index for source/target lookups
CREATE INDEX IF NOT EXISTS idx_form_edges_source ON form_edges(source);
CREATE INDEX IF NOT EXISTS idx_form_edges_target ON form_edges(target);
