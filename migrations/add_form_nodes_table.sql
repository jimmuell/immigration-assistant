-- Add form_nodes table for visual flow editor
CREATE TABLE IF NOT EXISTS form_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  position JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by flow_id
CREATE INDEX IF NOT EXISTS idx_form_nodes_flow_id ON form_nodes(flow_id);

-- Create index for node_id lookups within a flow
CREATE INDEX IF NOT EXISTS idx_form_nodes_node_id ON form_nodes(node_id);
