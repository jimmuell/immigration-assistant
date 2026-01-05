# Flow JSON Specification & Rendering Guide

## Overview

This document explains how to parse and render interactive questionnaire flows from JSON data. Flows are structured as directed graphs where **nodes** represent questions/screens and **connections** define navigation paths based on user responses.

## Table of Contents

1. [Flow Structure](#flow-structure)
2. [Node Types](#node-types)
3. [Connection System](#connection-system)
4. [Navigation Logic](#navigation-logic)
5. [Rendering Guidelines](#rendering-guidelines)
6. [Response Handling](#response-handling)
7. [State Management](#state-management)

---

## Flow Structure

A complete flow consists of three main components:

```typescript
interface Flow {
  metadata: FlowMetadata;      // Display information
  name: string;                // Flow name
  description?: string;        // Optional description
  nodes: FlowNode[];          // Array of question/screen definitions
  connections: FlowConnection[]; // Array of navigation rules
}
```

### Flow Metadata

```typescript
interface FlowMetadata {
  id: string;                  // Unique identifier (kebab-case)
  name: string;                // Human-readable name
  description: string;         // Description for selection UI
  estimatedMinutes: number;    // Estimated completion time
}
```

**Example:**
```json
{
  "id": "asylum-or-protection-from-persecution",
  "name": "Asylum or Protection From Persecution",
  "description": "Legal service for people in the U.S. who fear persecution...",
  "estimatedMinutes": 9
}
```

---

## Node Types

Nodes represent individual screens/questions. All nodes share these base properties:

```typescript
interface FlowNode {
  id: string;                  // UUID - unique identifier
  type: string;                // Node type (see below)
  question: string;            // Main text/question to display
  // ... type-specific properties
}
```

### 1. Start Node

The entry point of the flow. Always appears first.

```typescript
{
  id: "43164797-4164-49b1-ba96-f1bf4136a3dc",
  type: "start",
  question: "Start"
}
```

**Rendering:**
- Display flow metadata (name, description, estimated time)
- Show a "Start" or "Begin" button
- On button press, navigate to first question node
- Don't show progress bar yet

---

### 2. Yes/No Node

Binary choice question with customizable button labels.

```typescript
{
  id: "daf4281b-b9bf-40cf-b804-393ef125cefa",
  type: "yes-no",
  question: "Are you physically present in the United States?",
  yesLabel: "Yes, I'm in the U.S.",     // Optional, defaults to "Yes"
  noLabel: "No, I'm outside the U.S."   // Optional, defaults to "No"
}
```

**Properties:**
- `question`: The yes/no question to ask
- `yesLabel`: Custom label for affirmative option (optional)
- `noLabel`: Custom label for negative option (optional)

**Rendering:**
- Display the question in a prominent message bubble
- Show two buttons side-by-side:
  - Left button: Yes option (use `yesLabel` or "Yes")
  - Right button: No option (use `noLabel` or "No")
- Highlight selected option
- Enable "Continue" button after selection
- Store response as `"yes"` or `"no"` (lowercase string)

**Response Value:** `"yes"` | `"no"`

---

### 3. Text Input Node

Free-form text response, typically informational or requiring a short answer.

```typescript
{
  id: "998d9eca-00ba-4e76-914d-32dfbf95b5f8",
  type: "text",
  question: "What date did you enter the U.S.? Please provide the date or your best guess."
}
```

**Properties:**
- `question`: The text to display (can be multi-paragraph)

**Rendering:**
- Display the question text
- Some text nodes are purely informational (no input needed)
- If expecting user input:
  - Show a text input field or text area
  - Include "Continue" button
- Otherwise:
  - Show "Continue" or "Next" button to proceed
- Validate minimum length if collecting input

**Response Value:** `string` (the entered text or "acknowledged")

---

### 4. Multiple Choice Node

Single-select from a list of options.

```typescript
{
  id: "c7b1d6b6-d437-4d31-98e8-b3601b83e6dd",
  type: "multiple-choice",
  question: "How did you obtain your green card?",
  options: [
    { id: "1", label: "Marriage to a U.S. citizen" },
    { id: "2", label: "Family sponsorship" },
    { id: "1763265490668", label: "Employment" },
    { id: "1763265490860", label: "Asylum" },
    { id: "1763265525359", label: "Other / Not sure" }
  ]
}
```

**Properties:**
- `question`: The question text
- `options`: Array of choice objects
  - `id`: Unique identifier (string or number as string)
  - `label`: Display text for the option

**Rendering:**
- Display the question
- Show options as radio buttons or selectable cards
- Use a visual indicator (radio circle, checkmark) for selection
- Only allow one selection at a time
- Enable "Continue" after selection
- Store the selected option ID for navigation

**Response Value:** 
```typescript
{
  id: string,      // The option ID (used for routing)
  label: string    // The option label (for display)
}
```

**Important:** Save both `id` and `label`. The `id` is used for connection routing, while `label` is for displaying the user's answer in summaries.

---

### 5. Form Node

Multi-field data collection with validation.

```typescript
{
  id: "4ffb61a3-eb1b-4e46-86a7-cc97c29a4e3f",
  type: "form",
  question: "New Question",
  formTitle: "Briefly describe how you entered the U.S.",
  formDescription: "e.g. tourist visa, student visa, humanitarian parole",
  formFields: [
    {
      id: "1",
      type: "text",
      label: "Entry Method",
      placeholder: "Describe how you entered...",
      required: true
    }
  ]
}
```

**Properties:**
- `question`: Legacy field (may not be displayed)
- `formTitle`: Main title for the form
- `formDescription`: Optional helper text
- `formFields`: Array of field definitions

**Form Field Types:**
```typescript
interface FormField {
  id: string;                          // Unique within this form
  type: "text" | "email" | "phone" | "select" | "checkbox";
  label: string;                       // Field label
  placeholder?: string;                // Input placeholder
  required: boolean;                   // Whether field is mandatory
  options?: string[];                  // For select fields
}
```

**Rendering:**
- Display `formTitle` as the main heading
- Show `formDescription` if present
- Render each field based on its type:
  - `text`: Single-line text input
  - `email`: Email input with validation
  - `phone`: Phone number input
  - `select`: Dropdown/picker
  - `checkbox`: Checkbox input
- Mark required fields with an asterisk (*)
- Validate on submission:
  - Required fields must be filled
  - Minimum 2 characters for text fields
  - Appropriate format for email/phone
- Show validation errors inline
- Submit button labeled "Continue"

**Response Value:**
```typescript
{
  [fieldId: string]: string  // Map of field IDs to values
}
```

Example:
```json
{
  "1": "I entered with a tourist visa (B-2)"
}
```

---

### 6. End Node

Terminal node indicating flow completion.

```typescript
{
  id: "08b82547-f4ca-4a1f-8ed2-19eb3c644695",
  type: "end",
  question: "End",
  thankYouTitle: "Thank You",
  thankYouMessage: "Your responses have been recorded."
}
```

**Properties:**
- `thankYouTitle`: Title for completion screen
- `thankYouMessage`: Message to display
- `legalDisclaimer`: Optional disclaimer text
- `additionalInfoPrompt`: Optional prompt for extra information

**Rendering:**
- Display thank you title and message
- Show completion checkmark or success icon
- Provide "View Summary" button (to review answers)
- Provide "Finish" or "Submit" button (to exit flow)
- If `legalDisclaimer` exists, display it prominently
- Progress bar should show 100%

**Response Value:** None (terminal node)

---

## Connection System

Connections define navigation between nodes based on user responses.

```typescript
interface FlowConnection {
  id: string;              // Unique connection ID
  sourceNodeId: string;    // Origin node ID
  targetNodeId: string;    // Destination node ID
  condition: string;       // Routing condition
  label?: string;          // Optional display label
}
```

### Condition Types

| Condition | Meaning | Used With |
|-----------|---------|-----------|
| `"any"` | Always follow this path | `start`, `text`, `form` nodes, or as fallback |
| `"yes"` | Follow if user answered yes | `yes-no` nodes |
| `"no"` | Follow if user answered no | `yes-no` nodes |
| `"<optionId>"` | Follow if user selected this option | `multiple-choice` nodes |

### Example Connections

```json
[
  {
    "id": "1",
    "sourceNodeId": "start-node-id",
    "targetNodeId": "first-question-id",
    "condition": "any",
    "label": "Start"
  },
  {
    "id": "2",
    "sourceNodeId": "yes-no-node-id",
    "targetNodeId": "next-if-yes-id",
    "condition": "yes",
    "label": "Yes"
  },
  {
    "id": "3",
    "sourceNodeId": "yes-no-node-id",
    "targetNodeId": "next-if-no-id",
    "condition": "no",
    "label": "No"
  },
  {
    "id": "4",
    "sourceNodeId": "multiple-choice-node-id",
    "targetNodeId": "marriage-path-id",
    "condition": "1",
    "label": "Marriage"
  },
  {
    "id": "5",
    "sourceNodeId": "form-node-id",
    "targetNodeId": "next-question-id",
    "condition": "any"
  }
]
```

---

## Navigation Logic

### Algorithm for Finding Next Node

```typescript
function getNextNodeId(
  connections: FlowConnection[],
  currentNodeId: string,
  userResponse?: string | object
): string | null {
  
  // 1. Find all connections from current node
  const nodeConnections = connections.filter(
    conn => conn.sourceNodeId === currentNodeId
  );
  
  // 2. Determine the condition to match
  let responseCondition: string;
  
  if (typeof userResponse === 'object' && 'id' in userResponse) {
    // Multiple choice: use the option ID
    responseCondition = userResponse.id;
  } else if (userResponse === 'yes' || userResponse === 'no') {
    // Yes/No: use the response directly
    responseCondition = userResponse;
  } else {
    // Text/Form/Start: look for "any"
    responseCondition = "any";
  }
  
  // 3. Try to find specific condition match first
  const specificMatch = nodeConnections.find(
    conn => conn.condition.toLowerCase() === responseCondition.toLowerCase()
  );
  
  if (specificMatch) {
    return specificMatch.targetNodeId;
  }
  
  // 4. Fall back to "any" condition
  const anyMatch = nodeConnections.find(
    conn => conn.condition === "any"
  );
  
  if (anyMatch) {
    return anyMatch.targetNodeId;
  }
  
  // 5. No valid connection found
  return null;
}
```

### Connection Priority

1. **Specific condition match** (e.g., `"yes"`, `"no"`, `"<optionId>"`)
2. **"any" condition** (fallback/bypass)

This allows nodes to have both conditional paths and a default path.

---

## Rendering Guidelines

### Progressive Enhancement

1. **Start Screen**
   - Display flow metadata
   - Show estimated time
   - Big, prominent "Start" button
   - No progress indicator

2. **Question Screens**
   - Show progress bar (percentage or fraction)
   - Display question in a speech bubble or card
   - Render appropriate input UI for node type
   - Show "Back" button (except on first question)
   - Show "Continue" or type-specific action button

3. **End Screen**
   - Hide progress bar or show 100%
   - Display thank you message
   - Provide "View Summary" option
   - Provide "Finish"/"Submit" button

### Progress Calculation

```typescript
function calculateProgress(
  completedNodes: number,
  totalNodes: number
): number {
  if (totalNodes === 0) return 0;
  
  // Add 1 for current node being viewed
  const progress = (completedNodes + 1) / totalNodes;
  
  return Math.min(progress, 1.0); // Cap at 100%
}
```

### Back Navigation

Allow users to go back and change previous answers:

- Maintain a **node history** stack
- When going back:
  1. Pop the previous node ID from history
  2. Set it as current node
  3. Pre-populate the node with the previously saved response
  4. Remove the current node's response from saved responses
- Don't allow back on the start node
- Preserve the ability to change answers

### Accessibility

- Use semantic HTML/native components
- Add `accessibilityLabel` to all interactive elements
- Ensure keyboard navigation works
- Support screen readers
- Maintain focus management when navigating

---

## Response Handling

### Saving Responses

Store responses in a dictionary/map keyed by node ID:

```typescript
interface FlowState {
  flowId: string;
  currentNodeId: string;
  responses: Record<string, any>;  // nodeId -> response
  nodeHistory: string[];           // For back navigation
  isComplete: boolean;
  startedAt: Date;
}
```

**Example state:**
```json
{
  "flowId": "asylum-or-protection-from-persecution",
  "currentNodeId": "60e48409-cc0b-47b8-851a-a2e52947ba02",
  "responses": {
    "daf4281b-b9bf-40cf-b804-393ef125cefa": "yes",
    "1230adf5-c7c6-4246-9df9-abd678250a1f": "yes",
    "4ffb61a3-eb1b-4e46-86a7-cc97c29a4e3f": {
      "1": "I entered with a B-2 tourist visa"
    },
    "998d9eca-00ba-4e76-914d-32dfbf95b5f8": "March 2020",
    "db582f5b-5d5c-4b3a-9f90-bc7600a7d180": "yes",
    "ec7f1da3-5fd5-4c84-a7bc-f647c757cf2e": {
      "1": "My family was threatened by a local gang..."
    }
  },
  "nodeHistory": [
    "43164797-4164-49b1-ba96-f1bf4136a3dc",
    "daf4281b-b9bf-40cf-b804-393ef125cefa",
    "1230adf5-c7c6-4246-9df9-abd678250a1f",
    "4ffb61a3-eb1b-4e46-86a7-cc97c29a4e3f",
    "998d9eca-00ba-4e76-914d-32dfbf95b5f8",
    "db582f5b-5d5c-4b3a-9f90-bc7600a7d180",
    "ec7f1da3-5fd5-4c84-a7bc-f647c757cf2e"
  ],
  "isComplete": false,
  "startedAt": "2025-01-15T10:30:00.000Z"
}
```

### Response Format by Node Type

| Node Type | Response Format | Example |
|-----------|----------------|---------|
| `start` | `"start"` | `"start"` |
| `yes-no` | `"yes"` \| `"no"` | `"yes"` |
| `text` | `string` | `"March 2020"` |
| `form` | `Record<string, string>` | `{"1": "value"}` |
| `multiple-choice` | `{id: string, label: string}` | `{"id": "1", "label": "Marriage"}` |
| `end` | None | N/A |

---

## State Management

### Initialization

When starting a flow:

```typescript
function initializeFlowState(flowId: string, nodes: FlowNode[]): FlowState {
  const startNode = nodes.find(n => n.type === "start");
  
  if (!startNode) {
    throw new Error("Flow must have a start node");
  }
  
  return {
    flowId,
    currentNodeId: startNode.id,
    responses: {},
    nodeHistory: [],
    isComplete: false,
    startedAt: new Date()
  };
}
```

### Moving Forward

```typescript
function navigateToNextNode(
  state: FlowState,
  nodes: FlowNode[],
  connections: FlowConnection[],
  response: any
): FlowState {
  const nextNodeId = getNextNodeId(
    connections,
    state.currentNodeId,
    response
  );
  
  if (!nextNodeId) {
    // No next node - shouldn't happen unless flow is malformed
    return { ...state, isComplete: true };
  }
  
  const nextNode = nodes.find(n => n.id === nextNodeId);
  const isEndNode = nextNode?.type === "end";
  
  return {
    ...state,
    currentNodeId: nextNodeId,
    responses: {
      ...state.responses,
      [state.currentNodeId]: response
    },
    nodeHistory: [...state.nodeHistory, state.currentNodeId],
    isComplete: isEndNode
  };
}
```

### Moving Backward

```typescript
function navigateToPreviousNode(state: FlowState): FlowState {
  if (state.nodeHistory.length === 0) {
    return state; // Can't go back further
  }
  
  const previousNodeId = state.nodeHistory[state.nodeHistory.length - 1];
  const newHistory = state.nodeHistory.slice(0, -1);
  
  // Remove response for current node (user is changing their mind)
  const newResponses = { ...state.responses };
  delete newResponses[state.currentNodeId];
  
  return {
    ...state,
    currentNodeId: previousNodeId,
    nodeHistory: newHistory,
    responses: newResponses,
    isComplete: false
  };
}
```

### Persistence

For a better user experience:

1. **Auto-save** the flow state after each answer
2. **Resume** from saved state if user leaves and returns
3. **Clear** saved state after successful submission
4. **Expire** saved states after a reasonable time (e.g., 30 days)

---

## Complete Example Flow

Here's a minimal complete flow with all components:

```json
{
  "metadata": {
    "id": "example-flow",
    "name": "Example Flow",
    "description": "A simple example flow",
    "estimatedMinutes": 2
  },
  "name": "Example Flow",
  "description": "Demonstrates all node types",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "question": "Start"
    },
    {
      "id": "yesno-1",
      "type": "yes-no",
      "question": "Do you want to continue?",
      "yesLabel": "Yes, continue",
      "noLabel": "No, stop here"
    },
    {
      "id": "mc-1",
      "type": "multiple-choice",
      "question": "What is your favorite color?",
      "options": [
        { "id": "1", "label": "Red" },
        { "id": "2", "label": "Blue" },
        { "id": "3", "label": "Green" }
      ]
    },
    {
      "id": "form-1",
      "type": "form",
      "question": "Form Question",
      "formTitle": "Tell us about yourself",
      "formFields": [
        {
          "id": "name",
          "type": "text",
          "label": "Name",
          "required": true
        },
        {
          "id": "email",
          "type": "email",
          "label": "Email",
          "required": true
        }
      ]
    },
    {
      "id": "end-yes",
      "type": "end",
      "question": "End",
      "thankYouTitle": "Thank You!",
      "thankYouMessage": "We appreciate your responses."
    },
    {
      "id": "end-no",
      "type": "end",
      "question": "End",
      "thankYouTitle": "Maybe Next Time",
      "thankYouMessage": "Feel free to come back anytime."
    }
  ],
  "connections": [
    {
      "id": "c1",
      "sourceNodeId": "start-1",
      "targetNodeId": "yesno-1",
      "condition": "any"
    },
    {
      "id": "c2",
      "sourceNodeId": "yesno-1",
      "targetNodeId": "mc-1",
      "condition": "yes"
    },
    {
      "id": "c3",
      "sourceNodeId": "yesno-1",
      "targetNodeId": "end-no",
      "condition": "no"
    },
    {
      "id": "c4",
      "sourceNodeId": "mc-1",
      "targetNodeId": "form-1",
      "condition": "any"
    },
    {
      "id": "c5",
      "sourceNodeId": "form-1",
      "targetNodeId": "end-yes",
      "condition": "any"
    }
  ]
}
```

**Navigation Path Examples:**

1. User clicks "Start" → `yesno-1`
2. User selects "Yes" → `mc-1`
3. User selects any color → `form-1`
4. User submits form → `end-yes`

Alternative path:
1. User clicks "Start" → `yesno-1`
2. User selects "No" → `end-no`

---

## Best Practices

### For Flow Designers

1. **Always include a start node** - First node in the flow
2. **Every path should lead to an end node** - Avoid dead ends
3. **Use descriptive node IDs** - UUIDs are fine, but readable IDs help debugging
4. **Test all paths** - Ensure every connection works
5. **Provide clear questions** - Users should understand what's being asked
6. **Use appropriate node types** - Don't use text nodes for collecting data

### For Implementers

1. **Validate the flow** before rendering:
   - Ensure start node exists
   - Verify all connection node IDs are valid
   - Check for orphaned nodes
2. **Handle errors gracefully**:
   - Show user-friendly error messages
   - Log detailed errors for debugging
   - Provide a way to exit broken flows
3. **Save progress frequently** - After every answered question
4. **Support back navigation** - Let users correct mistakes
5. **Pre-populate previous answers** - When going back, show what they selected
6. **Validate user input** - Especially for form nodes
7. **Show clear progress** - Users want to know how far along they are

---

## Troubleshooting

### Common Issues

**Problem:** Next node not found after answering a question

**Solution:** 
- Check that connections exist from the current node
- Verify the condition matches the response format
- Ensure multiple-choice responses use the option ID
- Look for "any" condition as fallback

---

**Problem:** User's previous answer not showing when they go back

**Solution:**
- Ensure you're passing `previousValue` prop to node components
- Check that responses are being saved correctly in state
- Verify node components initialize their state with `previousValue`

---

**Problem:** Progress bar not updating

**Solution:**
- Recalculate progress after each state change
- Use `nodeHistory.length + 1` to account for current node
- Ensure total node count includes all nodes (not just question nodes)

---

**Problem:** Form validation not working

**Solution:**
- Check `required` property on form fields
- Implement proper validation logic (min length, format, etc.)
- Display errors inline near each field
- Prevent submission until validation passes

---

## Summary

This specification covers everything needed to parse and render flows:

1. **Flow Structure**: Metadata, nodes, and connections
2. **Node Types**: Six types (start, yes-no, text, form, multiple-choice, end)
3. **Connections**: Routing rules with conditions
4. **Navigation**: Algorithm for moving between nodes
5. **Rendering**: UI guidelines for each node type
6. **State**: How to track and manage flow progress
7. **Persistence**: Saving and resuming flows

Use this guide to build flow renderers, validators, or management tools. The system is flexible enough to support complex branching logic while remaining simple to implement.

