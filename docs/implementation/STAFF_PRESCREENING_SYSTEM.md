# Staff Pre-Screening System

**Feature:** Configurable Attorney Screening Visibility  
**Implemented:** January 6, 2026  
**Status:** ✅ Complete

## Overview

The Staff Pre-Screening System allows organizations (especially solo attorneys with staff) to control how client screenings are distributed to attorneys. Organizations can choose between two models: **Marketplace Mode** (attorneys see all available screenings) or **Gatekeeper Mode** (staff pre-screens and assigns).

## Use Cases

### Solo Attorney Without Staff
- Attorney handles everything themselves
- Wants to see all client screenings immediately
- Can browse and choose cases that match their expertise
- **Solution:** Marketplace Mode (default)

### Solo Attorney With Staff
- Staff acts as gatekeeper/intake coordinator
- Staff reviews screenings for completeness
- Staff requests additional information if needed
- Staff assigns vetted screenings to attorney
- Attorney only sees pre-screened, ready-to-review cases
- **Solution:** Gatekeeper Mode (enable staff pre-screening)

### Law Firm With Multiple Attorneys
- Can use either mode
- Marketplace: Attorneys compete for cases
- Gatekeeper: Staff distributes workload evenly

## Architecture

### Database Schema

**New Field Added to `organizations` table:**

```sql
require_staff_prescreening BOOLEAN NOT NULL DEFAULT false
```

**Values:**
- `false` (Default) = Marketplace Mode
- `true` = Gatekeeper Mode

### Workflow Modes

#### Mode 1: Marketplace Model (Default)

```
Client Submits Screening
         ↓
    ALL Attorneys See It
         ↓
Attorney Reviews & Sends Quote
```

**Visibility:**
- ✅ Staff/Admin: See all screenings
- ✅ Attorneys: See all unassigned + assigned to them
- ✅ Promotes attorney autonomy
- ✅ Faster response time

#### Mode 2: Gatekeeper Model (Enabled)

```
Client Submits Screening
         ↓
  Staff Reviews Screening
         ↓
Staff Requests More Info (if needed)
         ↓
   Staff Assigns to Attorney
         ↓
Attorney Sees Assigned Screening
         ↓
Attorney Reviews & Sends Quote
```

**Visibility:**
- ✅ Staff/Admin: See all screenings (always)
- ❌ Attorneys: Only see assigned screenings
- ✅ Quality control layer
- ✅ Workload distribution

## Technical Implementation

### Query Logic (`src/app/attorney/new-screenings/page.tsx`)

```typescript
// Get organization setting
const [org] = await db
  .select()
  .from(organizations)
  .where(eq(organizations.id, session.user.organizationId))
  .limit(1);

const requireStaffPreScreening = org?.requireStaffPreScreening || false;

// Determine visibility
const isStaffOrAdmin = ['org_admin', 'staff', 'super_admin'].includes(userRole);
const showAllScreenings = isStaffOrAdmin || !requireStaffPreScreening;

// Build query condition
const assignmentCondition = showAllScreenings
  ? or(
      eq(screenings.assignedAttorneyId, attorneyId!), // Assigned to me
      isNull(screenings.assignedAttorneyId)           // Or unassigned
    )
  : eq(screenings.assignedAttorneyId, attorneyId!);  // Only assigned to me
```

### Settings Management

**Location:** `/admin/settings`

**Files:**
- `page.tsx` - Settings page wrapper
- `settings-client.tsx` - Toggle UI
- `actions.ts` - Update server action

**Access Control:**
- Only `org_admin`, `staff`, and `super_admin` can change settings
- Settings are organization-specific

## User Interface

### Settings Page (`/admin/settings`)

**Components:**
1. **Toggle Switch** - Enable/disable staff pre-screening
2. **Explanatory Text** - Describes both modes
3. **Active State Indicator** - Shows current mode
4. **Organization Info** - Display org name and type

**Visual Design:**
- Switch component with blue active state
- Clear labels and descriptions
- Alert box when enabled showing impact
- Organized in cards for readability

### Attorney New Screenings Page

**Visual Indicators:**

**Marketplace Mode (Default):**
- Blue info card explaining how it works
- "Available" badges on unassigned screenings
- "Assigned to You" badges on assigned screenings

**Gatekeeper Mode (Enabled):**
- Purple info card explaining staff pre-screening
- Only assigned screenings displayed
- "Assigned to You" badges

### Screening Cards

**Assigned Screening:**
```
┌─────────────────────────────────────────┐
│ ✓ Case Title          [assigned]       │ ← Blue border
│    [Assigned to You]  ← Blue badge      │
│ 👤 Client Name  |  Jan 6              │
│                      [Review]           │
└─────────────────────────────────────────┘
```

**Available Screening (Marketplace Only):**
```
┌─────────────────────────────────────────┐
│ 🕐 Case Title        [submitted]        │ ← Gray border
│    [Available]  ← Gray badge            │
│ 👤 Client Name  |  Jan 6              │
│                 [View Details]          │
└─────────────────────────────────────────┘
```

## Staff Workflow (Gatekeeper Mode)

### Staff Tasks:
1. **Review Incoming Screenings** (`/admin/intakes`)
   - Check for completeness
   - Verify all required information provided

2. **Request Additional Info** (if needed)
   - Use `unlockForEditing()` action
   - Screening status → `awaiting_client`
   - Client can edit and re-submit

3. **Assign to Attorney**
   - Select appropriate attorney from dropdown
   - Consider attorney specialties and workload
   - Screening status → `assigned`

4. **Attorney Takes Over**
   - Attorney sees in "New Screenings"
   - Attorney reviews and proceeds with quote

## Benefits

### For Solo Attorneys:
✅ **Delegation** - Staff handles initial screening  
✅ **Quality Control** - Only complete cases reach attorney  
✅ **Time Savings** - Attorney focuses on legal review  
✅ **Flexible** - Can toggle on/off anytime  

### For Staff:
✅ **Clear Role** - Gatekeep and quality control  
✅ **Workload Management** - Distribute cases evenly  
✅ **Client Communication** - Request clarifications  
✅ **Full Access** - See all screenings always  

### For Clients:
✅ **Professional Service** - Cases vetted before attorney review  
✅ **Complete Review** - Staff ensures nothing missing  
✅ **Faster Processing** - Attorney gets complete information  

## Configuration

### Enable Staff Pre-Screening:

1. Login as org_admin or staff
2. Navigate to **Admin → Settings**
3. Toggle **"Require Staff Pre-Screening"** to ON
4. Attorneys immediately see filtered view

### Disable (Return to Marketplace):

1. Navigate to **Admin → Settings**
2. Toggle **"Require Staff Pre-Screening"** to OFF
3. Attorneys immediately see all available screenings

**Note:** Changes take effect immediately (uses Next.js revalidation)

## Important Notes

### Staff/Admin Always See Everything
- Regardless of the setting, staff and admins always see all screenings
- This ensures workflow doesn't get blocked
- Staff can always assign screenings

### Attorney Roles
- `attorney` role - Affected by the setting
- `org_admin` role - Always sees all screenings (even if they have attorney profile)
- `staff` role - Always sees all screenings

### Default Behavior
- New organizations default to `false` (marketplace mode)
- Provides immediate value for solo attorneys
- Can opt-in to gatekeeper mode later

## Future Enhancements

### Potential Additions:
- 📊 **Staff Review Status** - Track which staff reviewed which screening
- 📝 **Internal Notes** - Staff can add notes before assigning
- ⏱️ **SLA Tracking** - Time from submission to assignment
- 🎯 **Auto-Assignment Rules** - Based on specialties, workload, rotation
- 📧 **Staff Notifications** - Alert staff when new screenings arrive
- 📈 **Analytics** - Track staff review time, rejection rates
- ✅ **Approval Workflow** - Multi-step approval process
- 🏷️ **Tagging System** - Staff can tag screenings by type/urgency

## Testing Scenarios

### TS-STAFF-01: Enable Gatekeeper Mode
1. Login as org_admin
2. Navigate to `/admin/settings`
3. Toggle "Require Staff Pre-Screening" ON
4. ✅ Verify: Alert shows "Active" status
5. Login as attorney in same org
6. ✅ Verify: Only sees assigned screenings

### TS-STAFF-02: Marketplace Mode (Default)
1. Organization has setting OFF (default)
2. Client releases screening
3. Login as attorney
4. ✅ Verify: Sees screening with "Available" badge

### TS-STAFF-03: Staff Assignment in Gatekeeper
1. Enable gatekeeper mode
2. Client releases screening
3. Login as staff
4. Assign to attorney via dropdown
5. Login as attorney
6. ✅ Verify: Sees assigned screening

### TS-STAFF-04: Staff Request Additional Info
1. Staff reviews screening
2. Staff unlocks screening
3. ✅ Verify: Client sees "Action Required"
4. Client edits and re-releases
5. ✅ Verify: Returns to staff queue

## Related Features

- **Attorney Assignment** - Admin dropdown to assign screenings
- **Screening Lock System** - Client release workflow
- **Organization Management** - Organization CRUD operations
- **Role-Based Access** - Different views per role

## Related Documentation

- [Screening Submission & Lock System](./SCREENING_SUBMISSION_AND_LOCK_SYSTEM.md)
- [Solo Attorney Workflow](./SOLO_ATTORNEY_WORKFLOW.md)
- [Team Management](./TEAM_MANAGEMENT.md)
- [Organization Implementation](./FIRM_ORGANIZATION_IMPLEMENTATION.md)

---

**Last Updated:** January 6, 2026  
**Version:** 1.0  
**Migration:** `add_staff_prescreening_setting.sql`

