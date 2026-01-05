# Flow Parser UI Field Mapping

## Overview

This document explains how the flow parser determines which UI component to display for each step in a flow. The parser uses a type-based system where each flow node has a `type` field that directly maps to a specific UI component.

## Table of Contents

1. [Node Type System](#node-type-system)
2. [The Parsing Process](#the-parsing-process)
3. [Example: Date Entry Field](#example-date-entry-field)
4. [Node Type to UI Component Mapping](#node-type-to-ui-component-mapping)
5. [Form Fields](#form-fields)
6. [Type Definitions](#type-definitions)

---

## Node Type System

The flow system uses six core node types, each mapped to a specific UI component:

| Node Type | UI Component | Use Case |
|-----------|-------------|----------|
| `start` | `StartNode` | Welcome screen with flow metadata |
| `yes-no` | `YesNoNode` | Binary choice questions |
| `text` | `TextInputNode` | Free-form text input |
| `form` | `FormNode` | Multi-field forms |
| `multiple-choice` | `MultipleChoiceNode` | Selection from 3+ options |
| `end` | `EndNode` | Completion screen with summary |

### Type Definition

```typescript
export interface FlowNode {
  id: string;
  type: "start" | "yes-no" | "text" | "form" | "multiple-choice" | "end";
  question: string;
  // ... additional properties based on type
}
```

---

## The Parsing Process

### 1. Flow Data Structure

Flows are defined in `/data/flows/index.ts` with nodes and connections:

```typescript
const asylumFlowNodes: FlowNode[] = [
  {
    id: "998d9eca-00ba-4e76-914d-32dfbf95b5f8",
    type: "text",  // ← This determines the UI component
    question: "What date did you enter or arrive in the U.S.? Please provide the date or your best guess. If you don't know the date, an approximate date is fine.",
  },
  // ... more nodes
];
```

### 2. FlowRunner Component

The `FlowRunner` component (`/components/flows/FlowRunner.tsx`) is the parser that reads the node type and renders the appropriate component:

```typescript
export function FlowRunner({ flow, flowState, ... }) {
  const currentNode = flow.nodes.find(
    (node) => node.id === flowState.currentNodeId
  );

  // Switch statement maps node type to UI component
  switch (currentNode.type) {
    case "start":
      return <StartNode ... />;
    
    case "yes-no":
      return <YesNoNode node={currentNode} ... />;
    
    case "text":
      return <TextInputNode node={currentNode} ... />;
    
    case "form":
      return <FormNode node={currentNode} ... />;
    
    case "multiple-choice":
      return <MultipleChoiceNode node={currentNode} ... />;
    
    case "end":
      return <EndNode node={currentNode} ... />;
  }
}
```

**Key Points:**
- The parser uses a simple switch statement on `currentNode.type`
- Each node type maps to exactly one component
- The `node` object is passed to the component with all its properties
- No additional parsing or interpretation is needed

### 3. Navigation Flow

```
Flow Data (JSON)
    ↓
FlowRunner reads currentNodeId
    ↓
Finds node in flow.nodes array
    ↓
Switches on node.type
    ↓
Renders corresponding UI component
    ↓
User interacts with component
    ↓
Component calls onSubmit/onAnswer
    ↓
FlowRunner navigates to next node
```

---

## Example: Date Entry Field

Let's trace how the asylum flow's date question becomes a text input field.

### Step 1: Node Definition

In `/data/flows/index.ts`, step 5 of the asylum flow is defined:

```typescript
{
  id: "998d9eca-00ba-4e76-914d-32dfbf95b5f8",
  type: "text",  // ← Simple type indicator
  question: "What date did you enter or arrive in the U.S.? Please provide the date or your best guess. If you don't know the date, an approximate date is fine.",
}
```

**Why "text" type?**
- The `"text"` type indicates free-form text input
- Despite asking for a date, it uses text input because:
  - Users may not know exact dates ("approximate date is fine")
  - Allows flexibility: "Summer 2020", "Around March 2019", etc.
  - No validation for strict date format needed

### Step 2: Parser Identifies Type

When the user reaches this node, `FlowRunner` executes:

```typescript
const currentNode = flow.nodes.find(
  node => node.id === "998d9eca-00ba-4e76-914d-32dfbf95b5f8"
);
// currentNode.type === "text"

switch (currentNode.type) {
  case "text":
    return <TextInputNode node={currentNode} onSubmit={handleResponse} ... />;
}
```

### Step 3: TextInputNode Renders

The `TextInputNode` component (`/components/flows/nodes/TextInputNode.tsx`) renders a multiline text input:

```typescript
export function TextInputNode({ node, onSubmit, ... }) {
  const [text, setText] = useState("");

  return (
    <View>
      {/* Displays the question */}
      <Text>{node.question}</Text>
      
      {/* Multiline text input for flexible date entry */}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type your answer..."
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      
      <Button title="Continue" onPress={() => onSubmit(text)} />
    </View>
  );
}
```

### Step 4: User Input & Validation

The component includes basic validation:

```typescript
const handleSubmit = () => {
  const trimmedText = text.trim();

  // Required field
  if (!trimmedText) {
    setError("This field is required");
    return;
  }

  // Minimum length
  if (trimmedText.length < 2) {
    setError("Please enter at least 2 characters");
    return;
  }

  // Maximum length
  if (trimmedText.length > 500) {
    setError("Please enter no more than 500 characters");
    return;
  }

  onSubmit(trimmedText);
};
```

**Why This Works for Dates:**
- Flexible: accepts "March 2019", "03/15/2019", "Around spring 2020"
- User-friendly: no strict format requirements
- Validation: ensures something is entered without being overly restrictive

---

## Node Type to UI Component Mapping

### 1. `"start"` → StartNode

**Purpose:** Welcome screen  
**UI Features:**
- Flow name and description
- Estimated completion time
- Large "Start" button
- No input fields

**Example:**
```typescript
{
  id: "start-1",
  type: "start",
  question: "Start",
}
```

### 2. `"yes-no"` → YesNoNode

**Purpose:** Binary choice questions  
**UI Features:**
- Question text
- Two large buttons (Yes/No)
- Optional custom labels via `yesLabel` and `noLabel`

**Example:**
```typescript
{
  id: "node-1",
  type: "yes-no",
  question: "Are you currently in the United States?",
  yesLabel: "Yes",  // Optional: defaults to "Yes"
  noLabel: "No",    // Optional: defaults to "No"
}
```

**Custom Labels Example:**
```typescript
{
  id: "node-2",
  type: "yes-no",
  question: "When you entered the U.S., were you inspected by a U.S. border officer?",
  yesLabel: "I was inspected and admitted",
  noLabel: "I entered without being inspected",
}
```

### 3. `"text"` → TextInputNode

**Purpose:** Free-form text responses  
**UI Features:**
- Question text
- Multiline text input (4 lines default)
- Character counter (500 max)
- Continue button
- Basic validation

**Example:**
```typescript
{
  id: "node-3",
  type: "text",
  question: "What date did you enter or arrive in the U.S.?",
}
```

**When to Use:**
- Open-ended questions
- Dates (when flexibility needed)
- Short narratives
- Any response that doesn't fit yes/no or predefined choices

### 4. `"form"` → FormNode

**Purpose:** Multi-field data collection  
**UI Features:**
- Form title (optional)
- Form description (optional)
- Multiple labeled input fields
- Field-level validation
- Required field indicators

**Example:**
```typescript
{
  id: "node-4",
  type: "form",
  question: "New Question",
  formTitle: "Briefly describe how you entered the U.S.",
  formDescription: "For example: tourist visa, student visa, humanitarian parole",
  formFields: [
    {
      id: "1",
      type: "text",
      label: "Entry Method",
      placeholder: "e.g., Tourist visa",
      required: true,
    },
  ],
}
```

**Form Field Types:**
- `"text"` - Single-line text input
- `"email"` - Email-validated input
- `"phone"` - Phone number input
- `"select"` - Dropdown selection
- `"checkbox"` - Boolean checkbox

### 5. `"multiple-choice"` → MultipleChoiceNode

**Purpose:** Selection from 3+ options  
**UI Features:**
- Question text
- List of selectable options
- Single selection (radio button style)
- Continue button (enabled after selection)

**Example:**
```typescript
{
  id: "node-5",
  type: "multiple-choice",
  question: "How did you obtain your green card?",
  options: [
    { id: "1", label: "Marriage to a U.S. citizen" },
    { id: "2", label: "Family sponsorship" },
    { id: "3", label: "Employment" },
    { id: "4", label: "Asylum" },
    { id: "5", label: "Other / Not sure" },
  ],
}
```

### 6. `"end"` → EndNode

**Purpose:** Completion screen  
**UI Features:**
- Thank you message
- Optional custom title and message
- "View Summary" button
- "Finish" button

**Example:**
```typescript
{
  id: "end-1",
  type: "end",
  question: "End",
  thankYouTitle: "Thank You",
  thankYouMessage: "Your responses have been recorded.",
}
```

---

## Form Fields

Form nodes can contain multiple fields, each with its own type. The `FormNode` component handles rendering different input types within a single screen.

### Form Field Structure

```typescript
export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "select" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select fields
}
```

### Form Field Type Mapping

The `FormNode` component renders different inputs based on `field.type`:

```typescript
// In FormNode.tsx (conceptual example)
{fields.map((field) => {
  switch (field.type) {
    case "text":
      return <TextInput ... />;
    
    case "email":
      return <TextInput keyboardType="email-address" ... />;
    
    case "phone":
      return <TextInput keyboardType="phone-pad" ... />;
    
    case "select":
      return <Picker items={field.options} ... />;
    
    case "checkbox":
      return <Checkbox ... />;
  }
})}
```

### Example: Multi-Field Form

```typescript
{
  id: "contact-form",
  type: "form",
  formTitle: "Contact Information",
  formDescription: "Please provide your contact details",
  formFields: [
    {
      id: "name",
      type: "text",
      label: "Full Name",
      placeholder: "John Doe",
      required: true,
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      placeholder: "john@example.com",
      required: true,
    },
    {
      id: "phone",
      type: "phone",
      label: "Phone Number",
      placeholder: "(555) 123-4567",
      required: false,
    },
    {
      id: "contactMethod",
      type: "select",
      label: "Preferred Contact Method",
      required: true,
      options: ["Email", "Phone", "Text Message"],
    },
  ],
}
```

---

## Type Definitions

### Complete FlowNode Interface

```typescript
export interface FlowNode {
  id: string;
  type: "start" | "yes-no" | "text" | "form" | "multiple-choice" | "end";
  question: string;
  
  // Yes-No specific
  yesLabel?: string | null;
  noLabel?: string | null;
  
  // Multiple-choice specific
  options?: MultipleChoiceOption[] | null;
  
  // Form specific
  formTitle?: string | null;
  formDescription?: string | null;
  formFields?: FormField[];
  
  // End node specific
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  
  // Optional metadata
  legalDisclaimer?: string | null;
  additionalInfoPrompt?: string | null;
  position?: { x: number; y: number };
}
```

### Supporting Interfaces

```typescript
export interface MultipleChoiceOption {
  id: string;
  label: string;
}

export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "select" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select fields
}

export interface FlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition: "any" | "yes" | "no" | string; // String for option IDs
  label?: string;
}
```

---

## Decision-Making Guide

### When to Use Each Node Type

#### Use `"text"` when:
- The answer is open-ended
- Dates need flexibility (approximate dates allowed)
- Short narrative responses required
- No predefined options exist
- User needs to explain something

#### Use `"yes-no"` when:
- Question has exactly two options
- Binary decision required
- Simple confirmation needed
- Example: "Are you currently in the U.S.?"

#### Use `"multiple-choice"` when:
- 3 or more predefined options exist
- User must select exactly one option
- Options are mutually exclusive
- Example: "How did you obtain your green card?"

#### Use `"form"` when:
- Multiple related fields needed on one screen
- Structured data collection required
- Different input types needed (email, phone, text)
- Example: Contact information, personal details

### Special Case: Dates

Dates can be handled in multiple ways:

**Text Input (Flexible):**
```typescript
{
  type: "text",
  question: "What date did you enter the U.S.? An approximate date is fine.",
}
```
✅ Accepts: "March 2019", "Around summer 2020", "03/15/2019"

**Form Field (Structured):**
```typescript
{
  type: "form",
  formFields: [
    { id: "date", type: "text", label: "Entry Date", required: true }
  ]
}
```
✅ Use when collecting multiple pieces of information including a date

**Future Enhancement (Date Picker):**
Currently not implemented, but could be added as:
```typescript
{
  type: "form",
  formFields: [
    { id: "date", type: "date", label: "Entry Date", required: true }
  ]
}
```

---

## Summary

The flow parser uses a straightforward type-based mapping system:

1. **Node Type Determines UI**: The `type` field on each FlowNode directly maps to a UI component
2. **Simple Switch Statement**: FlowRunner uses a switch on `node.type` to render the correct component
3. **No Complex Parsing**: No additional interpretation, regex, or AI-based parsing needed
4. **Flexible Text Input**: For dates and other semi-structured data, `"text"` type provides flexibility
5. **Form Fields for Structure**: When strict structure is needed, use `"form"` type with typed fields

**Key Insight**: The "parser" isn't doing complex analysis of the question text to determine the UI. Instead, it relies on the explicitly defined `type` field in the node definition. The question text is just displayed as-is by the selected component.

