# Flow Status System - Simplified Single-State Model

## Overview

The flow status system has been simplified from a confusing dual-button approach (Draft/Publish + Active/Inactive) to a clear, linear single-state workflow.

## Status States

Flows now have **three clear states** that follow a natural progression:

### 1. Draft (Orange)
- **What it means**: Flow is a work in progress
- **Database**: `isDraft = true`, `isActive = false`
- **Can edit?**: ✅ Yes, freely
- **Available to clients?**: ❌ No
- **Icon**: 📝 FileEdit
- **Use when**: Creating, testing, or making changes

### 2. Inactive (Gray)
- **What it means**: Flow is published but not yet live
- **Database**: `isDraft = false`, `isActive = false`
- **Can edit?**: ⚠️ Must return to Draft first
- **Available to clients?**: ❌ No
- **Icon**: 👁 Eye
- **Use when**: Flow is ready but waiting for the right time to go live

### 3. Active (Green)
- **What it means**: Flow is live and available to clients
- **Database**: `isDraft = false`, `isActive = true`
- **Can edit?**: ⚠️ Must return to Draft first
- **Available to clients?**: ✅ Yes
- **Icon**: ✅ CheckCircle
- **Use when**: Flow is ready for production use

## Workflow

### Linear Progression

```
Draft → Inactive → Active
  ↑                   ↓
  └─── Return to Draft ←┘
```

### State Transitions

1. **Draft → Inactive** (Publish)
   - Click the status button
   - Flow is published but not yet available to clients
   - Good for preparing flows in advance

2. **Inactive → Active** (Activate)
   - Click the status button
   - Flow becomes available to clients immediately
   - Monitor for issues

3. **Active → Inactive** (Deactivate)
   - Click the status button
   - Flow is removed from client availability
   - Use when you need to pause a flow temporarily

4. **Any State → Draft** (Return to Draft)
   - Click "Return to Draft" button (shown when not in Draft)
   - Flow returns to editable draft state
   - Also deactivates if currently active
   - Use when you need to make changes

## Best Practices

### Recommended Flow

1. **Create** a new flow (starts as Draft)
2. **Design** your questions and logic
3. **Test** thoroughly using Test Mode
4. **Refine** based on test results
5. **Publish** as Inactive (validates flow is ready)
6. **Review** one final time
7. **Activate** when you're confident
8. **Monitor** client usage and feedback

### Testing Workflow

Always use Test Mode before publishing:

```
Create Flow (Draft)
   ↓
Design Flow
   ↓
Test with Test Mode ← ┐
   ↓                   │
Problems found? ──────┘
   ↓
Works perfectly?
   ↓
Publish as Inactive
   ↓
Final Review
   ↓
Activate
```

### Editing Published Flows

If you need to edit an Active or Inactive flow:

1. Click "Return to Draft"
2. Make your changes
3. Test again with Test Mode
4. Publish as Inactive
5. Activate when ready

**Warning**: Returning to Draft will deactivate the flow if it's currently Active.

## Technical Implementation

### Database Fields

```typescript
{
  isDraft: boolean;  // true = Draft, false = Published (Inactive or Active)
  isActive: boolean; // true = Active, false = Draft or Inactive
}
```

### State Logic

```typescript
// Draft
isDraft = true, isActive = false

// Inactive (Published but not live)
isDraft = false, isActive = false

// Active (Published and live)
isDraft = false, isActive = true
```

### Server Actions

- `cycleFlowStatus(id)` - Advances flow to next state in progression
- `unpublishFlow(id)` - Returns flow to Draft (also deactivates)

### State Determination

```typescript
function getStatus(flow) {
  if (flow.isDraft) return "Draft";
  if (flow.isActive) return "Active";
  return "Inactive";
}
```

## UI Components

### Status Button

Shows current state and next action:
- "Draft → Publish as Inactive"
- "Inactive → Activate"
- "Active → Deactivate"

### Return to Draft Button

Appears when flow is not in Draft state:
- Only shown for Inactive or Active flows
- Allows users to make edits
- Automatically deactivates if currently Active

## Permissions

### Organization Admins

- ✅ Can manage all states for their organization's flows
- ✅ Can cycle through states
- ✅ Can return flows to Draft
- ❌ Cannot modify global flows (read-only)

### Super Admins

- ✅ Can manage all states for all flows
- ✅ Full control over global and organization flows

### Staff

- 👁 Can view flows only
- ❌ Cannot change status
- ❌ Cannot edit flows

## Migration from Old System

### What Changed

**Before** (Confusing):
- Two separate columns: Draft/Published and Active/Inactive
- Could create invalid states (e.g., Draft + Active)
- Unclear workflow

**After** (Clear):
- Single Status column with clear progression
- Invalid states are prevented by design
- Clear visual workflow

### Backward Compatibility

- Existing flows automatically work with new system
- Database schema unchanged (same `isDraft` and `isActive` fields)
- No data migration needed

## Troubleshooting

**Q: Why can't I edit my flow?**
A: If the flow is Inactive or Active, click "Return to Draft" first.

**Q: Can I skip the Inactive state?**
A: No, all flows must go through: Draft → Inactive → Active. This ensures proper review.

**Q: What happens if I return an Active flow to Draft?**
A: It's immediately deactivated and becomes unavailable to clients. Make sure this is intentional.

**Q: Can I go directly from Active back to Draft?**
A: Yes, using "Return to Draft" button. This will deactivate the flow.

**Q: What's the benefit of the Inactive state?**
A: It lets you prepare flows in advance without making them immediately available. Good for scheduled launches.

## Examples

### Simple Flow Lifecycle

```
Day 1: Create "Visa Screening" (Draft)
Day 1: Design and test (Draft)
Day 2: Publish as Inactive (Inactive)
Day 3: Activate for clients (Active)
Day 5: Need changes, Return to Draft (Draft)
Day 5: Make changes and test (Draft)
Day 5: Publish and Activate (Inactive → Active)
```

### Seasonal Flow

```
Nov 1: Create "Holiday Visa Rush" (Draft)
Nov 5: Test and publish (Draft → Inactive)
Nov 15: Wait for holiday season (Inactive)
Dec 1: Activate for holidays (Active)
Jan 15: Deactivate after season (Inactive)
Feb 1: Return to Draft for updates (Draft)
```

---

**Last Updated**: January 12, 2026  
**Version**: 2.0  
**Breaking Changes**: None (UI-only update, backward compatible)
