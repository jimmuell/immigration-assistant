# Visual Builder Empty Canvas Issue

## Problem

When clicking the "Visual Builder" button for a flow, the canvas appears empty with no nodes or edges displayed.

## Root Cause

The visual builder loads flow data from two database tables:
- `formNodes` - Contains the visual nodes (questions, forms, etc.)
- `formEdges` - Contains the connections between nodes

However, flows can be created or updated in two ways:

1. **Visual Builder** - Directly creates/updates `formNodes` and `formEdges` tables
2. **Markdown Editor** - Updates only the `flows.content` field with JSON embedded in markdown

When a flow is created or edited via the markdown editor, the visual builder tables (`formNodes` and `formEdges`) are NOT automatically updated. This causes the canvas to appear empty even though the flow has valid JSON data.

## Solution

### Quick Fix - Sync Existing Flows

Run the sync script to populate visual builder data from existing flow JSON:

```bash
npx tsx scripts/sync-flow-to-visual-builder.ts
```

Or sync all flows at once:

```bash
npx tsx scripts/sync-all-flows-to-visual-builder.ts
```

### What the Sync Script Does

1. Reads the flow content from the `flows` table
2. Extracts the JSON structure from the markdown (looks for the last ```json block)
3. Parses the nodes and connections
4. Creates corresponding entries in `formNodes` and `formEdges` tables
5. Calculates auto-layout positions for the nodes using a BFS algorithm

## Prevention

To prevent this issue in the future, we need to implement **bidirectional sync** between the markdown editor and visual builder:

### Option 1: Auto-sync on Save (Recommended)

Modify the flow save action (`src/app/admin/flows/actions.ts`) to:

1. When saving markdown content, detect if it contains JSON
2. Parse the JSON and update `formNodes` and `formEdges` tables
3. This ensures both representations stay in sync

### Option 2: Sync Button

Add a "Sync to Visual Builder" button in the markdown editor that:

1. Parses the current JSON
2. Updates the visual builder tables
3. Shows a success message

### Option 3: Deprecate Markdown Editor

Consider making the visual builder the primary editing interface and:

1. Auto-generate markdown from visual builder on save
2. Make markdown view read-only or remove it entirely
3. This ensures a single source of truth

## Technical Details

### Database Schema

```sql
-- Visual builder nodes
CREATE TABLE form_nodes (
  id UUID PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  position JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Visual builder edges
CREATE TABLE form_edges (
  id UUID PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Flow Data Structure

Flows are stored in JSON format within markdown:

```markdown
# Flow Name

```json
{
  "name": "Flow Name",
  "description": "Description",
  "nodes": [
    {
      "id": "uuid",
      "type": "start|yes-no|text|form|multiple-choice|end",
      "question": "Question text",
      // ... type-specific fields
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "sourceNodeId": "uuid",
      "targetNodeId": "uuid",
      "condition": "yes|no|any|option-label"
    }
  ]
}
\```
```

## Related Files

- `/scripts/sync-flow-to-visual-builder.ts` - Syncs a single flow
- `/scripts/sync-all-flows-to-visual-builder.ts` - Syncs all flows
- `/src/app/admin/flows-editor/actions.ts` - Visual builder save actions
- `/src/app/admin/flows/actions.ts` - Markdown editor save actions
- `/src/app/admin/flows-editor/[id]/flow-editor-client.tsx` - Visual builder component

## Testing

After running the sync script:

1. Navigate to `/admin/flows`
2. Find the "Asylum or Protection From Persecution" flow
3. Click "Visual Builder"
4. Verify that nodes and edges are displayed on the canvas
5. Verify that you can:
   - Select nodes
   - Edit node properties
   - Add new nodes
   - Create connections
   - Save changes

## Future Improvements

1. **Automatic Sync**: Implement auto-sync when saving markdown
2. **Conflict Resolution**: Handle cases where both markdown and visual builder are edited
3. **Migration Tool**: Create a one-time migration to sync all historical flows
4. **Validation**: Add validation to ensure JSON and visual builder stay in sync
5. **Single Source of Truth**: Consider deprecating one editing method

