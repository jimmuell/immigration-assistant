# Screening Submission and Lock System

**Feature:** Released Screenings with Edit Lock Protection  
**Implemented:** January 6, 2026  
**Status:** ✅ Complete

## Overview

The Screening Submission and Lock System provides a controlled workflow for clients to complete, review, and release their screenings to attorneys. Once released, screenings are locked from further editing to maintain data integrity during the attorney review process.

## Architecture

### Database Schema

**New Fields Added to `screenings` table:**

```sql
-- Lock status
is_locked BOOLEAN NOT NULL DEFAULT false

-- Submission timestamp
submitted_for_review_at TIMESTAMP

-- Index for performance
CREATE INDEX screenings_locked_idx ON screenings(is_locked)
```

### Workflow States

| Status | Locked? | Client Can | Attorney Can |
|--------|---------|------------|--------------|
| `draft` | ❌ No | Edit freely, Delete | - |
| `submitted` | ✅ Yes | View only | Assign, Review |
| `assigned` | ✅ Yes | View only | Review, Message |
| `in_progress` | ✅ Yes | View only | Review, Message, Quote |
| `awaiting_client` | ❌ No | Edit, Submit | Unlock, Message |
| `quoted` | ✅ Yes | Accept/Decline quote | View |
| `quote_accepted` | ✅ Yes | View, Message | Work on case |
| `quote_declined` | ✅ Yes | View only | View |

## User Interface

### Client Navigation

**New Menu Structure:**
```
Client Dashboard
├── Home (dashboard with metrics)
├── Saved (draft screenings)
├── Completed (unlocked, can submit)
└── Released (locked, in attorney review) ← NEW
```

**Icons Used:**
- **Home:** House icon
- **Saved:** Bookmark icon  
- **Completed:** CheckCircle icon
- **Released:** Send icon

### Pages

#### 1. `/completed` - Completed Screenings
**Purpose:** Review completed screenings before releasing to attorneys

**Features:**
- Lists all completed, unlocked screenings
- Shows "Submit for Review" button for draft screenings
- Shows "Edit" button for editable screenings
- View details button for all screenings
- Delete option available

**User Actions:**
- ✏️ Edit screening (if unlocked)
- 📤 Submit for Review (draft status)
- 👁️ View Details
- 🗑️ Delete

#### 2. `/released` - Released Screenings  
**Purpose:** Track screenings that have been released to attorneys

**Features:**
- Lists all locked screenings (released for attorney review)
- Shows lock indicators
- Status badges (submitted, assigned, in_progress, quoted)
- Attorney assignment notifications
- View-only mode (no edit/submit buttons)

**User Actions:**
- 👁️ View Details only
- Cannot edit or delete (locked)

## Client Workflow

### Step-by-Step Process

#### 1. Complete Screening
```
Client fills out flow → Auto-saves as draft → Status: 'draft'
Location: Can resume from "Saved" or "Completed" tab
```

#### 2. Review Before Release
```
Navigate to "Completed" tab
Review responses
Click "Submit for Review" button
```

#### 3. Confirm Release
```
Confirmation Dialog:
"Once submitted, you will not be able to edit your responses 
until an attorney reviews them. Make sure all your information 
is correct before proceeding."

[Cancel] [Submit for Review]
```

#### 4. Released to Attorneys
```
✅ status = 'submitted'
✅ isLocked = true
✅ submittedForReviewAt = current timestamp

Moves to "Released" tab
Locked from editing
```

#### 5. Attorney Review Process
```
Admin assigns to attorney → status = 'assigned' (still locked)
Attorney reviews → status = 'in_progress' (still locked)
Attorney requests changes → status = 'awaiting_client' (UNLOCKED)
Attorney sends quote → status = 'quoted' (locked)
```

#### 6. Attorney Requests Changes
```
If attorney calls unlockForEditing():
✅ status = 'awaiting_client'
✅ isLocked = false

Moves back to "Completed" tab
Shows "Action Required" alert
Client can edit and re-submit
```

## Technical Implementation

### Server Actions

**Location:** `src/app/completed/actions.ts`

#### `submitForReview(screeningId)`
```typescript
// Locks screening and marks as submitted
- Verifies user ownership
- Checks if already locked
- Updates: status = 'submitted', isLocked = true
- Records: submittedForReviewAt timestamp
- Revalidates: /completed, /client paths
```

#### `unlockForEditing(screeningId, requestMessage?)`
```typescript
// Attorney action to request client changes
- Requires attorney/admin role
- Updates: status = 'awaiting_client', isLocked = false
- Revalidates: /attorney/screenings, /completed paths
```

#### `getUserScreenings()`
```typescript
// Returns ONLY unlocked, completed screenings
- Filters: isLocked = false, status != 'draft'
- Used by: /completed page
```

#### `getReleasedScreenings()`
```typescript
// Returns ONLY locked screenings
- Filters: isLocked = true
- Orders by: submittedForReviewAt DESC
- Used by: /released page
```

### UI Components

#### `ScreeningsClient` (`src/app/completed/screenings-client.tsx`)
```typescript
Features:
- canSubmitForReview() - Shows submit button for drafts
- canEdit() - Shows edit button for unlocked screenings
- handleSubmitConfirm() - Submits for review with lock
- Visual indicators for locked status
```

#### `ReleasedScreeningsClient` (`src/app/released/released-screenings-client.tsx`)
```typescript
Features:
- Lock icons on all cards
- Blue left border for visual distinction
- Status badges with color coding
- Attorney assignment notifications
- View-only mode (no action buttons)
```

### Flow Protection

**Location:** `src/app/flow/[id]/page.tsx`

```typescript
// Prevents editing locked screenings
if (draft.isLocked) {
  redirect(`/completed/${draft.id}`); // Redirect to view page
}
```

## Visual Design

### Status Colors

| Status | Color | Badge |
|--------|-------|-------|
| Draft | Gray | `bg-gray-100 text-gray-700` |
| Submitted | Blue | `bg-blue-100 text-blue-700` |
| Assigned | Purple | `bg-purple-100 text-purple-700` |
| In Progress | Yellow | `bg-yellow-100 text-yellow-700` |
| Awaiting Client | Orange | `bg-orange-100 text-orange-700` |
| Quoted | Green | `bg-green-100 text-green-700` |

### Lock Indicators

**Locked Screening:**
- 🔒 Lock icon badge
- Blue left border (4px)
- "Locked" text badge
- Gray lock icon in card

**Action Required (awaiting_client):**
- 🟠 Orange alert banner
- "Action Required: Your attorney has requested changes"
- Edit button enabled

## Benefits

✅ **Data Integrity** - No accidental changes during review  
✅ **Clear Status** - Visual indicators show locked state  
✅ **User Control** - Client decides when to release  
✅ **Flexible Workflow** - Attorneys can request changes  
✅ **Audit Trail** - Timestamp tracks when released  
✅ **Better Organization** - Separate tabs for different states  

## Database Migrations

### Migration 1: Add Lock Fields
**File:** `migrations/add_screening_lock_and_submit_fields.sql`

```sql
ALTER TABLE screenings 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE screenings 
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS screenings_locked_idx ON screenings(is_locked);
```

### Migration 2: Make Client Organization Nullable
**File:** `migrations/make_users_organization_nullable.sql`

```sql
-- Clients don't have organizationId until quote acceptance
ALTER TABLE users 
ALTER COLUMN organization_id DROP NOT NULL;
```

## Testing

### Test Scenarios

#### TS-01: Submit Draft for Review
1. Navigate to /completed
2. Find draft screening
3. Click "Submit for Review"
4. Confirm in dialog
5. ✅ Verify: Moves to /released, status = 'submitted', locked

#### TS-02: View Released Screening
1. Navigate to /released
2. Click screening
3. ✅ Verify: Can view details but cannot edit

#### TS-03: Attorney Requests Changes
1. Attorney calls unlockForEditing()
2. Client refreshes /released
3. ✅ Verify: Screening moves back to /completed
4. ✅ Verify: Shows "Action Required" alert
5. ✅ Verify: Edit button enabled

#### TS-04: Lock Protection
1. Try to navigate to /flow/{id} for locked screening
2. ✅ Verify: Redirects to /completed/{id}
3. ✅ Verify: Cannot edit

#### TS-05: Mobile Navigation
1. Test on mobile viewport
2. ✅ Verify: "Released" tab appears in bottom tab bar
3. ✅ Verify: Navigation works correctly

## Future Enhancements

### Potential Additions
- 📧 Email notifications when attorney assigned
- 💬 In-app notifications for status changes
- 📊 Timeline view showing screening progress
- 🔔 Reminder to release completed screenings
- 📝 Comments/notes field for attorney feedback
- 📎 Ability to attach documents before releasing

### Related Features
- Attorney dashboard already shows assigned screenings
- Admin dashboard shows all screenings with assignment dropdown
- Quote system integrates with lock status

## Related Documentation

- [Client Role Testing](../testing/02_CLIENT_ROLE_TESTING.md) - Client workflow tests
- [Attorney Role Testing](../testing/03_ATTORNEY_ROLE_TESTING.md) - Attorney review tests
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Overall system architecture
- [Database Schema](../../src/lib/db/schema.ts) - Complete schema definitions

## Notes

- This feature reuses existing code - no duplication
- Lock status is independent of workflow status
- Attorneys can unlock screenings when needed
- Client organization assignment happens on quote acceptance
- Global flows (organizationId = null) visible to all clients

---

**Last Updated:** January 6, 2026  
**Updated By:** AI Assistant  
**Version:** 1.0

