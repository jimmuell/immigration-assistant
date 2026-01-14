# Visual Flow Builder System

This document provides a comprehensive guide to the visual flow builder system, including database schema, data structures, and component interactions. This is intended to support the development of a separate flow builder application that will eventually replace the in-app builder.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Flow JSON Data Structure](#flow-json-data-structure)
4. [Node Types](#node-types)
5. [Visual Editor Components](#visual-editor-components)
6. [Flow Parsing & Rendering](#flow-parsing--rendering)
7. [Flow Lifecycle & Publishing](#flow-lifecycle--publishing)
8. [Screening Integration](#screening-integration)
9. [API Endpoints](#api-endpoints)
10. [File Structure](#file-structure)
11. [Export Format for External Builder](#export-format-for-external-builder)
12. [React Flow Configuration](#react-flow-configuration)

---

## Overview

The flow builder is a visual form/questionnaire system that allows administrators to design conditional logic flows for client intake. Flows are created using a drag-and-drop interface built on [React Flow](https://reactflow.dev/) and are stored as JSON embedded in markdown.

### Recommended Entry Point for Code Review

If you are an AI agent or developer scanning this codebase, start with these files in order:

| Priority | File | Description |
|----------|------|-------------|
| 1 | `src/app/admin/flows-editor/[id]/flow-editor-client.tsx` | **Main visual editor** - orchestrates React Flow canvas, sidebars, validation, and save logic |
| 2 | `src/components/flow-editor/nodes/index.ts` | Node type registry - maps node types to React components |
| 3 | `src/lib/flow-parser.ts` | Flow parsing logic - converts JSON/markdown to executable flow |
| 4 | `src/components/flow-renderer.tsx` | Client-side flow execution - renders flows for end users |
| 5 | `src/types/index.ts` | TypeScript type definitions for flows, nodes, edges |

**Key Capabilities:**
- Visual drag-and-drop flow design
- Conditional branching (yes/no, multiple choice)
- Multiple input types (text, date, forms)
- Subflow navigation (linking flows together)
- Draft/publish lifecycle management
- Organization-scoped and global flows
- Client-side flow execution with save/resume

---

## Database Schema

### `flows` Table

The main table storing flow metadata and content.

```sql
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),  -- null = global flow
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,           -- JSON/markdown flow definition
  is_active BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX flows_organization_idx ON flows(organization_id);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | null = global (super admin), set = org-specific |
| `name` | TEXT | Display name for the flow |
| `description` | TEXT | Optional description |
| `content` | TEXT | JSON flow definition (embedded in markdown) |
| `is_active` | BOOLEAN | Whether clients can access this flow |
| `is_draft` | BOOLEAN | Draft flows are editable, published are locked |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `form_nodes` Table

Stores individual node definitions for the visual editor.

```sql
CREATE TABLE form_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,           -- React Flow node ID
  type TEXT NOT NULL,              -- Node type (start, end, yes-no, etc.)
  data JSONB,                      -- Node-specific configuration
  position JSONB,                  -- {x: number, y: number}
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `flow_id` | UUID | Foreign key to flows table |
| `node_id` | TEXT | React Flow's internal node identifier |
| `type` | TEXT | Node type: `start`, `end`, `yes-no`, `multiple-choice`, `text`, `date`, `form`, `info`, `success`, `subflow` |
| `data` | JSONB | Node configuration (question, options, validation, etc.) |
| `position` | JSONB | Canvas position `{x: number, y: number}` |

### `form_edges` Table

Stores connections between nodes.

```sql
CREATE TABLE form_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL,           -- React Flow edge ID
  source TEXT NOT NULL,            -- Source node ID
  target TEXT NOT NULL,            -- Target node ID
  source_handle TEXT,              -- For conditional branching (yes/no handles)
  target_handle TEXT,
  data JSONB,                      -- Edge configuration (labels, conditions)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `flow_id` | UUID | Foreign key to flows table |
| `edge_id` | TEXT | React Flow's internal edge identifier |
| `source` | TEXT | Source node ID |
| `target` | TEXT | Target node ID |
| `source_handle` | TEXT | Handle identifier for conditional branching (`yes`, `no`, `option-0`, etc.) |
| `target_handle` | TEXT | Target handle (usually `target`) |
| `data` | JSONB | Edge configuration |

### `screenings` Table

Stores user responses to flows.

```sql
CREATE TABLE screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  assigned_attorney_id UUID REFERENCES users(id),
  flow_id UUID REFERENCES flows(id),
  flow_name TEXT,
  submission_id TEXT,
  responses TEXT,                  -- JSON string of Q&A pairs
  current_step_id TEXT,            -- For resuming progress
  status screening_status DEFAULT 'draft',
  is_test_mode BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  submitted_for_review_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Status enum values:
-- draft, submitted, reviewed, assigned, in_progress,
-- awaiting_client, quoted, quote_accepted, quote_declined
```

---

## Flow JSON Data Structure

Flows are stored in the `flows.content` column as JSON embedded in a markdown code block. The JSON structure is the authoritative format for flow definitions.

### Root Structure

```typescript
interface FlowDefinition {
  name: string;                    // Display name
  description?: string;            // Optional description
  nodes: FlowNode[];               // All steps in the flow
  connections: FlowConnection[];   // Navigation edges
}
```

### FlowNode Structure

```typescript
interface FlowNode {
  id: string;                      // Unique identifier (UUID recommended)
  type: NodeType;                  // Node type
  question: string;                // Display text / question

  // Yes/No node specific
  yesLabel?: string | null;        // Custom "Yes" button text
  noLabel?: string | null;         // Custom "No" button text

  // Multiple choice specific
  options?: Array<{
    id: string | number;
    label: string;
  }>;

  // Text/Date input specific
  placeholder?: string;
  defaultValue?: string;
  fieldName?: string;
  required?: boolean;

  // Form node specific
  formTitle?: string | null;
  formDescription?: string | null;
  formFields?: FormField[];

  // End/Success node specific
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;

  // Info node specific
  infoMessage?: string | null;

  // Subflow node specific
  subflowId?: string | null;       // UUID of the target flow
}

type NodeType =
  | 'start'
  | 'end'
  | 'yes-no'
  | 'multiple-choice'
  | 'text'
  | 'date'
  | 'form'
  | 'info'
  | 'success'
  | 'subflow';
```

### FormField Structure

```typescript
interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: string[];              // For select/radio/checkbox
}
```

### FlowConnection Structure

```typescript
interface FlowConnection {
  id: string;                      // Unique connection ID
  sourceNodeId: string;            // From which node
  targetNodeId: string;            // To which node
  condition: string;               // 'yes' | 'no' | 'any' | option label
  label?: string;                  // Optional edge label
}
```

### Complete Example

```json
{
  "name": "Asylum Screening",
  "description": "Initial screening for asylum cases",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "question": "Asylum Screening"
    },
    {
      "id": "q1",
      "type": "yes-no",
      "question": "Are you currently in the United States?",
      "yesLabel": "Yes, I am",
      "noLabel": "No, I am not"
    },
    {
      "id": "q2",
      "type": "multiple-choice",
      "question": "How did you enter the United States?",
      "options": [
        { "id": "1", "label": "With a visa" },
        { "id": "2", "label": "Without inspection" },
        { "id": "3", "label": "At a port of entry" }
      ]
    },
    {
      "id": "form1",
      "type": "form",
      "formTitle": "Personal Information",
      "formDescription": "Please provide your details",
      "formFields": [
        {
          "id": "name",
          "type": "text",
          "label": "Full Name",
          "required": true
        },
        {
          "id": "dob",
          "type": "date",
          "label": "Date of Birth",
          "required": true
        },
        {
          "id": "country",
          "type": "text",
          "label": "Country of Origin",
          "required": true
        }
      ]
    },
    {
      "id": "end-not-eligible",
      "type": "end",
      "question": "Not Eligible",
      "thankYouTitle": "Thank You",
      "thankYouMessage": "Based on your responses, you may not be eligible for asylum. Please consult with an attorney."
    },
    {
      "id": "success-1",
      "type": "success",
      "question": "Screening Complete",
      "thankYouTitle": "Submission Received",
      "thankYouMessage": "Your screening has been submitted. An attorney will review your case."
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "sourceNodeId": "start-1",
      "targetNodeId": "q1",
      "condition": "any"
    },
    {
      "id": "conn-2",
      "sourceNodeId": "q1",
      "targetNodeId": "q2",
      "condition": "yes"
    },
    {
      "id": "conn-3",
      "sourceNodeId": "q1",
      "targetNodeId": "end-not-eligible",
      "condition": "no"
    },
    {
      "id": "conn-4",
      "sourceNodeId": "q2",
      "targetNodeId": "form1",
      "condition": "any"
    },
    {
      "id": "conn-5",
      "sourceNodeId": "form1",
      "targetNodeId": "success-1",
      "condition": "any"
    }
  ]
}
```

---

## Node Types

### Start Node
Entry point for the flow. Every flow must have exactly one start node.

```typescript
{
  id: string;
  type: 'start';
  question: string;  // Flow title displayed on start screen
}
```

**Visual Editor:** Green colored, single output handle

### End Node
Terminates the flow without success state. Used for ineligible paths.

```typescript
{
  id: string;
  type: 'end';
  question: string;
  thankYouTitle?: string;
  thankYouMessage?: string;
}
```

**Visual Editor:** Gray colored, single input handle

### Success Node
Terminates the flow with a success/completion state.

```typescript
{
  id: string;
  type: 'success';
  question: string;
  thankYouTitle?: string;
  thankYouMessage?: string;
}
```

**Visual Editor:** Green with checkmark, single input handle

### Yes/No Node
Binary choice question with two output paths.

```typescript
{
  id: string;
  type: 'yes-no';
  question: string;
  yesLabel?: string;   // Custom "Yes" text
  noLabel?: string;    // Custom "No" text
}
```

**Visual Editor:** Blue colored, one input handle, two output handles (`yes`, `no`)

### Multiple Choice Node
Question with multiple selectable options.

```typescript
{
  id: string;
  type: 'multiple-choice';
  question: string;
  options: Array<{ id: string; label: string }>;
}
```

**Visual Editor:** Purple colored, one input handle, output handles for each option (`option-0`, `option-1`, etc.)

### Text Input Node
Single-line or multi-line text input.

```typescript
{
  id: string;
  type: 'text';
  question: string;
  placeholder?: string;
  required?: boolean;
}
```

**Visual Editor:** Indigo colored, one input handle, one output handle

### Date Node
Date picker input.

```typescript
{
  id: string;
  type: 'date';
  question: string;
  placeholder?: string;
  required?: boolean;
}
```

**Visual Editor:** Cyan colored, one input handle, one output handle

### Form Node
Multi-field form for collecting structured data.

```typescript
{
  id: string;
  type: 'form';
  formTitle?: string;
  formDescription?: string;
  formFields: FormField[];
}
```

**Visual Editor:** Orange colored, one input handle, one output handle

### Info Node
Display information without collecting input.

```typescript
{
  id: string;
  type: 'info';
  question: string;
  infoMessage?: string;
}
```

**Visual Editor:** Displays info icon, one input handle, one output handle

### Subflow Node
Navigates to another flow.

```typescript
{
  id: string;
  type: 'subflow';
  question: string;
  subflowId: string;  // UUID of the target flow
}
```

**Visual Editor:** Pink colored, one input handle, one output handle

---

## Visual Editor Components

### Component Hierarchy

```
FlowEditorClient
├── ReactFlow (canvas)
│   ├── Custom Nodes (StartNode, YesNoNode, etc.)
│   ├── Edges
│   └── Controls (zoom, minimap)
├── ComponentSidebar (draggable node palette)
├── NodeEditorPanel (selected node properties)
├── FlowPreviewModal (live preview)
└── ValidationDialog (error display)
```

### ComponentSidebar

Provides draggable node types organized by category:

| Category | Node Types |
|----------|------------|
| Input Nodes | Form Builder, Text Input, Date Picker |
| Question Nodes | Yes/No, Multiple Choice |
| Logic Nodes | Subflow |
| Action Nodes | Start, End, Success, Info |

### NodeEditorPanel

Right sidebar for editing selected node properties:

- Question text and labels
- Options management (add/remove/reorder)
- Form field configuration
- Validation rules (required, email, phone, min/max, pattern)
- Subflow selection

### Validation Rules

Before saving, flows are validated for:

1. **Start node exists** - Exactly one start node required
2. **End/Success node exists** - At least one termination point
3. **All nodes connected** - No orphan nodes
4. **All nodes reachable** - Path from start to every node
5. **Valid node types** - All types are supported
6. **No cycles** - Infinite loop detection

---

## Flow Parsing & Rendering

### Parser Location

`src/lib/flow-parser.ts`

### Key Function

```typescript
function parseFlowMarkdown(markdown: string): ParsedFlow
```

### Parsing Pipeline

1. **Extract JSON** from markdown code blocks
2. **Parse nodes** into FlowStep objects
3. **Build connections** with conditional logic
4. **Validate structure** (title, start node, references)
5. **Return ParsedFlow** with steps and navigation map

### ParsedFlow Structure

```typescript
interface ParsedFlow {
  title: string;
  steps: FlowStep[];
  startStepId: string;
}

interface FlowStep {
  id: string;
  type: NodeType;
  question: string;
  options: FlowOption[];
  placeholder?: string;
  fieldName?: string;
  required?: boolean;
  formFields?: FormField[];
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  infoMessage?: string | null;
  subflowId?: string | null;
}

interface FlowOption {
  label: string;
  nextStepId: string;
}
```

### FlowRenderer Component

`src/components/flow-renderer.tsx`

Handles client-side flow execution:

- Step-by-step navigation with history
- Progress bar (percentage of completed steps)
- Input validation
- Response collection
- Save/resume capability
- Test mode support

---

## Flow Lifecycle & Publishing

### States

```
Create → Draft → Publish → Active → Deactivate → Inactive
         ↑                            │
         └────────────────────────────┘
```

| State | `is_draft` | `is_active` | Editable | Client Visible |
|-------|------------|-------------|----------|----------------|
| Draft | true | false | Yes | No |
| Published (Inactive) | false | false | No | No |
| Published (Active) | false | true | No | Yes |

### Actions

| Action | Description | Permission |
|--------|-------------|------------|
| Create | New draft flow | Org Admin, Super Admin |
| Edit | Modify draft flow | Owner org admin, Super Admin |
| Publish | Convert draft to published | Super Admin only |
| Activate | Make visible to clients | Super Admin only |
| Deactivate | Hide from clients | Super Admin only |
| Import | Upload .md file as new flow | Org Admin, Super Admin |
| Export | Download flow as .md file | Any admin |

### Access Control

| Role | Global Flows | Org Flows |
|------|--------------|-----------|
| Super Admin | Full access | Full access |
| Org Admin | View only | Full access (own org) |
| Staff | View only | View only |
| Client | Active only | Active only |

---

## Screening Integration

### Data Flow

```
Client opens /flow/[id]
        ↓
FlowPage (server) validates flow is active
        ↓
FlowClient loads user's saved draft (if exists)
        ↓
FlowRenderer displays step-by-step UI
        ↓
User answers questions
        ↓
POST /api/screenings (save progress)
        ↓
Responses saved to screenings table
        ↓
User completes flow
        ↓
Status set to 'submitted', isLocked = true
        ↓
Redirect to /saved or /test-screenings
```

### Screening Status Flow

```
draft → submitted → reviewed → assigned → in_progress → awaiting_client → quoted → quote_accepted/quote_declined
```

### Response Format

Responses are stored as JSON string in `screenings.responses`:

```json
[
  { "question": "Are you in the US?", "answer": "Yes" },
  { "question": "How did you enter?", "answer": "With a visa" },
  { "question": "Full Name", "answer": "John Doe" }
]
```

---

## API Endpoints

### Save/Update Screening

```
POST /api/screenings
```

**Request Body:**
```typescript
{
  flowId: string;           // UUID of the flow
  flowName: string;         // Flow name for display
  responses: Response[];    // Array of {question, answer}
  status: 'draft' | 'submitted';
  screeningId?: string;     // For updates
  currentStepId?: string;   // For resume capability
  isTestMode?: boolean;
}
```

**Response:**
```typescript
{
  id: string;
  submissionId: string;
  // ... full screening object
}
```

### Flow Management (Admin)

Located in `src/app/admin/flows/actions.ts`:

- `getFlows()` - List flows
- `createFlow(data)` - Create new flow
- `updateFlow(id, data)` - Update flow metadata
- `deleteFlow(id)` - Delete flow
- `duplicateFlow(id)` - Clone flow
- `publishFlow(id)` - Convert to published
- `activateFlow(id)` - Make visible to clients

### Visual Editor

Located in `src/app/admin/flows-editor/[id]/actions.ts`:

- `getFlowWithNodes(id)` - Load flow with nodes/edges
- `saveFlowNodes(flowId, nodes, edges)` - Save visual editor state
- `convertFlowToMarkdown(nodes, edges, flowName)` - Generate JSON content

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── flows/                          # Flow management dashboard
│   │   │   ├── page.tsx                    # Flow list
│   │   │   ├── flows-client.tsx            # Client component
│   │   │   ├── actions.ts                  # CRUD operations
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Edit flow metadata
│   │   │       └── flow-edit-client.tsx
│   │   └── flows-editor/                   # Visual editor
│   │       ├── page.tsx                    # Editor entry
│   │       ├── layout.tsx
│   │       ├── actions.ts                  # Save nodes/edges
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── flow-editor-client.tsx  # Main visual editor
│   ├── flow/[id]/
│   │   ├── page.tsx                        # Serve active flow
│   │   └── flow-client.tsx
│   └── api/
│       └── screenings/
│           └── route.ts                    # Save/update screening
│
├── components/
│   ├── flow-renderer.tsx                   # Interactive flow UI
│   └── flow-editor/
│       ├── nodes/
│       │   ├── StartNode.tsx
│       │   ├── EndNode.tsx
│       │   ├── YesNoNode.tsx
│       │   ├── MultipleChoiceNode.tsx
│       │   ├── TextInputNode.tsx
│       │   ├── DateNode.tsx
│       │   ├── FormNode.tsx
│       │   ├── InfoNode.tsx
│       │   ├── SuccessNode.tsx
│       │   ├── SubflowNode.tsx
│       │   └── index.ts
│       ├── ComponentSidebar.tsx            # Node palette
│       ├── NodeEditorPanel.tsx             # Node properties
│       ├── FlowPreviewModal.tsx            # Live preview
│       └── ValidationDialog.tsx            # Error display
│
├── lib/
│   ├── flow-parser.ts                      # JSON/Markdown parsing
│   └── db/
│       └── schema.ts                       # Database tables
│
└── types/
    └── index.ts                            # Type definitions
```

---

## Export Format for External Builder

When building a separate application to create flows, the export format should be the JSON structure documented in [Flow JSON Data Structure](#flow-json-data-structure). The JSON should be wrapped in markdown:

````markdown
```json
{
  "name": "Flow Name",
  "description": "Optional description",
  "nodes": [...],
  "connections": [...]
}
```
````

### Import Requirements

When importing flows created by the external builder:

1. **Validate JSON structure** against the schema
2. **Generate UUIDs** for nodes/connections if not provided
3. **Validate connections** reference existing nodes
4. **Check for cycles** and unreachable nodes
5. **Store in `flows.content`** column
6. **Optionally populate `form_nodes` and `form_edges`** tables for visual editor compatibility

### Database Synchronization

The visual editor maintains two representations:

1. **`flows.content`** - Authoritative JSON/markdown content
2. **`form_nodes` + `form_edges`** - Visual editor state

When saving from the visual editor, both are updated. When importing, you may choose to:

- Only update `flows.content` (simpler, editor will rebuild on open)
- Update all three tables (maintains visual positions)

---

## React Flow Configuration

This section provides detailed React Flow configuration for developers building the external flow builder application.

### Official Documentation Links

- **React Flow Main Docs**: [https://reactflow.dev](https://reactflow.dev)
- **Custom Nodes**: [https://reactflow.dev/learn/customization/custom-nodes](https://reactflow.dev/learn/customization/custom-nodes)
- **Handles (Ports)**: [https://reactflow.dev/learn/customization/handles](https://reactflow.dev/learn/customization/handles)
- **Custom Edges**: [https://reactflow.dev/learn/customization/custom-edges](https://reactflow.dev/learn/customization/custom-edges)
- **ReactFlow Component API**: [https://reactflow.dev/api-reference/react-flow](https://reactflow.dev/api-reference/react-flow)
- **Edge Types API**: [https://reactflow.dev/api-reference/types/edge-types](https://reactflow.dev/api-reference/types/edge-types)
- **Terms & Definitions**: [https://reactflow.dev/learn/concepts/terms-and-definitions](https://reactflow.dev/learn/concepts/terms-and-definitions)
- **GitHub Repository**: [https://github.com/xyflow/xyflow](https://github.com/xyflow/xyflow)
- **NPM Package**: [https://www.npmjs.com/package/@xyflow/react](https://www.npmjs.com/package/@xyflow/react)

### Package Installation

```bash
npm install @xyflow/react
```

### Core Imports

```typescript
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
```

### ReactFlow Component Configuration

The main `<ReactFlow />` component configuration used in this project:

```tsx
<ReactFlow
  nodes={nodes}                    // Node[] - array of node objects
  edges={edges}                    // Edge[] - array of edge objects
  onNodesChange={handleNodesChange}  // Callback for node changes (drag, select, remove)
  onEdgesChange={handleEdgesChange}  // Callback for edge changes
  onConnect={onConnect}            // Callback when user connects two handles
  onNodeClick={onNodeClick}        // Callback when node is clicked
  onPaneClick={onPaneClick}        // Callback when canvas background is clicked
  onInit={setReactFlowInstance}    // Callback when React Flow initializes
  onDrop={onDrop}                  // Callback for drag-and-drop from sidebar
  onDragOver={onDragOver}          // Required for drag-and-drop
  nodeTypes={nodeTypes}            // Custom node type registry
  fitView                          // Auto-fit view to show all nodes on load
  minZoom={0.1}                    // Minimum zoom level
  maxZoom={2}                      // Maximum zoom level
  className="bg-background"
>
  <Background />                   {/* Grid background pattern */}
  <Controls />                     {/* Zoom in/out/fit controls */}
  <MiniMap nodeStrokeWidth={3} />  {/* Mini overview map */}
  <Panel position="bottom-right">  {/* Custom UI panels */}
    {nodes.length} nodes • {edges.length} edges
  </Panel>
</ReactFlow>
```

### Node Types Registration

**CRITICAL**: Define `nodeTypes` OUTSIDE the component to prevent infinite re-renders.

```typescript
// src/components/flow-editor/nodes/index.ts

import StartNode from './StartNode';
import EndNode from './EndNode';
import YesNoNode from './YesNoNode';
import MultipleChoiceNode from './MultipleChoiceNode';
import TextInputNode from './TextInputNode';
import DateNode from './DateNode';
import FormNode from './FormNode';
import InfoNode from './InfoNode';
import SuccessNode from './SuccessNode';
import SubflowNode from './SubflowNode';

// Define outside component - this is important!
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  'yes-no': YesNoNode,
  'multiple-choice': MultipleChoiceNode,
  text: TextInputNode,
  date: DateNode,
  form: FormNode,
  info: InfoNode,
  success: SuccessNode,
  subflow: SubflowNode,
};
```

### Custom Node Structure

Custom nodes receive `NodeProps` with access to `id`, `data`, `position`, and more.

```tsx
// Example: YesNoNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export default memo(function YesNoNode({ data }: NodeProps) {
  return (
    <div className="node-container">
      {/* Target handle - where edges connect TO this node */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500"
      />

      {/* Node content */}
      <div className="node-content">
        {data.question}
      </div>

      {/* Source handles - where edges connect FROM this node */}
      {/* Multiple handles need unique IDs */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"                              // Unique ID for this handle
        className="!bg-green-500"
        style={{ left: '33%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"                               // Unique ID for this handle
        className="!bg-red-500"
        style={{ left: '66%' }}
      />
    </div>
  );
});
```

### Handle Configuration

Handles are connection points on nodes. Key properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'source'` \| `'target'` | Source = outgoing edge start, Target = incoming edge end |
| `position` | `Position` | `Position.Top`, `Position.Bottom`, `Position.Left`, `Position.Right` |
| `id` | `string` | Required when node has multiple handles of same type |
| `isConnectable` | `boolean` | Whether handle accepts connections (default: true) |
| `style` | `CSSProperties` | Custom positioning and styling |

**Handle IDs Used in This Project:**

| Node Type | Handle IDs |
|-----------|------------|
| Start | `source` (default) |
| End/Success | `target` (default) |
| Yes/No | `target`, `yes`, `no` |
| Multiple Choice | `target`, `option-0`, `option-1`, `option-2`, etc. |
| Text/Date/Form/Info | `target`, `source` (default) |
| Subflow | `target`, `source` |

### Node Data Structure

Custom data passed to nodes:

```typescript
interface FormNodeData {
  label?: string;              // Display name
  question?: string;           // Question text
  description?: string;        // Additional description

  // Yes/No specific
  yesLabel?: string;           // Custom "Yes" button text
  noLabel?: string;            // Custom "No" button text

  // Multiple choice specific
  options?: string[];          // Array of option labels

  // Form specific
  formFields?: FormField[];    // Array of form field configs

  // Text/Date specific
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  fieldName?: string;

  // Subflow specific
  subflowId?: string;

  // UI state
  collapsed?: boolean;         // Whether node is visually collapsed
  highlighted?: boolean;       // Whether node is highlighted (for validation)
}
```

### Edge Structure

Edges connect source handles to target handles:

```typescript
interface FlowEdge {
  id: string;                  // Unique edge ID
  source: string;              // Source node ID
  target: string;              // Target node ID
  sourceHandle?: string;       // Source handle ID (e.g., 'yes', 'no', 'option-0')
  targetHandle?: string;       // Target handle ID (usually 'target' or undefined)
  data?: {
    label?: string;            // Edge label for display
  };
}
```

### State Management Hooks

React Flow provides built-in hooks for state management:

```typescript
// Initialize with data from database
const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
```

### Event Handlers

**IMPORTANT**: Define handlers with `useCallback` to prevent re-render loops.

```typescript
// Handle new connections
const onConnect = useCallback(
  (params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  },
  [setEdges]
);

// Handle node position changes
const handleNodesChange = useCallback(
  (changes: NodeChange[]) => {
    onNodesChange(changes);
    // Track unsaved changes
    const hasModifications = changes.some(change =>
      change.type === 'add' ||
      change.type === 'remove' ||
      (change.type === 'position' && change.dragging === false)
    );
    if (hasModifications) setHasUnsavedChanges(true);
  },
  [onNodesChange]
);
```

### Drag and Drop from Sidebar

Enable adding nodes by dragging from a component palette:

```typescript
// Sidebar component sets data on drag start
const onDragStart = (event: React.DragEvent, nodeType: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

// Canvas handles drop
const onDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}, []);

const onDrop = useCallback(
  (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');

    // Convert screen coordinates to flow coordinates
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: type },
    };

    setNodes((nds) => nds.concat(newNode));
  },
  [reactFlowInstance, setNodes]
);
```

### Viewport Control

Programmatic viewport control:

```typescript
// Get instance on init
const [reactFlowInstance, setReactFlowInstance] = useState(null);

// Navigate to a specific node
const navigateToNode = (nodeId: string) => {
  const node = nodes.find(n => n.id === nodeId);
  if (node && reactFlowInstance) {
    reactFlowInstance.setCenter(
      node.position.x + 150,  // Center offset
      node.position.y + 50,
      {
        zoom: 1.2,
        duration: 500,  // Animation duration in ms
      }
    );
  }
};

// Fit view to show all nodes
reactFlowInstance.fitView({ padding: 0.2 });
```

### MiniMap Configuration

```tsx
<MiniMap
  nodeStrokeWidth={3}
  nodeColor={(node) => {
    switch (node.type) {
      case 'start': return '#22c55e';    // green
      case 'end': return '#6b7280';      // gray
      case 'success': return '#22c55e';  // green
      case 'yes-no': return '#3b82f6';   // blue
      default: return '#8b5cf6';         // purple
    }
  }}
  className="bg-card"
/>
```

### Background Options

```tsx
<Background
  variant="dots"           // 'dots' | 'lines' | 'cross'
  gap={16}                 // Space between pattern elements
  size={1}                 // Size of pattern elements
  color="#aaa"             // Pattern color
/>
```

### Performance Considerations

1. **Memoize custom nodes** with `memo()` to prevent unnecessary re-renders
2. **Define `nodeTypes` outside components** - this is critical
3. **Use `useCallback` for all event handlers**
4. **Avoid inline styles** where possible
5. For large flows (100+ nodes), consider:
   - `nodesDraggable={false}` during bulk operations
   - Virtualization (handled automatically by React Flow)
   - Debouncing state updates

---

## Notes for External Builder Development

1. **Node IDs**: Use UUIDs for reliability across systems
2. **Validation**: Implement the same validation rules as the internal builder
3. **Preview**: Consider implementing a preview renderer using the same FlowRenderer component logic
4. **Versioning**: Consider adding version metadata for migration support
5. **Testing**: Export test flows from the current system to validate compatibility
