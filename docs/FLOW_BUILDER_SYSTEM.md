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

---

## Overview

The flow builder is a visual form/questionnaire system that allows administrators to design conditional logic flows for client intake. Flows are created using a drag-and-drop interface built on [React Flow](https://reactflow.dev/) and are stored as JSON embedded in markdown.

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

## Notes for External Builder Development

1. **Node IDs**: Use UUIDs for reliability across systems
2. **Validation**: Implement the same validation rules as the internal builder
3. **Preview**: Consider implementing a preview renderer using the same FlowRenderer component logic
4. **Versioning**: Consider adding version metadata for migration support
5. **Testing**: Export test flows from the current system to validate compatibility
