# Enhanced Firm Matching Implementation

## Overview

This document describes the **enhanced organization matching system** that combines website domain matching with organization name validation and user confirmation. This provides a more robust, user-friendly experience compared to the simple domain-only matching.

## What's New

### Previous Implementation
- Attorney enters firm website → Automatically joins if domain matches
- No confirmation step
- No name validation

### Enhanced Implementation  
- Attorney enters firm website → System checks if organization exists
- **If exists**: Shows organization name and asks for confirmation
- **If not exists**: Asks for firm name to create new organization
- Better UX with visual feedback and validation

## Database Schema Updates

### New Fields in `organizations` Table

```sql
-- User-friendly display name
display_name TEXT

-- Array of alternative domains for firms with multiple websites
alternative_domains TEXT[]
```

**Purpose:**
- `display_name`: Shown in UI for better user experience (e.g., "Smith & Associates" instead of "smith-associates-llp")
- `alternative_domains`: Supports firms with multiple domains (e.g., old domain after rebranding)

## Architecture

### 1. Domain Check API (`/api/auth/check-firm-domain`)

**Purpose**: Check if an organization with a given domain already exists

**Request:**
```json
{
  "website": "smithlaw.com"
}
```

**Response (Exists):**
```json
{
  "exists": true,
  "organization": {
    "id": "uuid",
    "name": "Smith & Associates",
    "website": "https://smithlaw.com",
    "type": "law_firm"
  },
  "domainKey": "smithlaw.com"
}
```

**Response (Not Exists):**
```json
{
  "exists": false,
  "domainKey": "smithlaw.com"
}
```

### 2. Attorney Signup API (Enhanced)

**New Field:**
- `confirmJoinExisting`: Boolean flag confirming user wants to join existing org

**Flow:**

```
POST /api/auth/attorney-signup
    ↓
If part_of_firm && existing org found && !confirmJoinExisting:
    ↓
    Return 409 Conflict
    {
      "error": "confirmation_required",
      "requiresConfirmation": true,
      "organization": { name, website },
      "message": "Please confirm..."
    }
    ↓
If part_of_firm && no existing org && !firmName:
    ↓
    Return 400 Bad Request
    { "error": "Firm name is required" }
    ↓
Otherwise:
    ↓
    Create/Join organization
    Create user account
    Return success
```

### 3. Enhanced UI Flow

**Step-by-Step User Experience:**

1. **Attorney Selects "Part of a Law Firm"**
   - Shows firm website input field
   - Hints: "Enter your firm's website to check if it's already registered"

2. **Attorney Enters Website and Leaves Field (onBlur)**
   - Shows loading state: "Checking if this organization already exists..."
   - Calls `/api/auth/check-firm-domain`

3. **Scenario A: Organization Exists**
   ```
   ┌─────────────────────────────────────────┐
   │ ✓ Organization Found!                   │
   │                                         │
   │ We found "Smith & Associates" with      │
   │ this website domain.                    │
   │                                         │
   │ ☑ Yes, I confirm I want to join        │
   │   Smith & Associates                    │
   └─────────────────────────────────────────┘
   ```
   - Green confirmation box appears
   - Requires checkbox confirmation to proceed
   - Firm name field is NOT shown (joining existing)

4. **Scenario B: Organization Does Not Exist**
   ```
   ┌─────────────────────────────────────────┐
   │ ℹ️ New Organization                      │
   │                                         │
   │ You'll be creating a new organization.  │
   │ Please enter your firm's name.          │
   │                                         │
   │ Law Firm Name: [________________] *     │
   └─────────────────────────────────────────┘
   ```
   - Yellow info box appears
   - Firm name input becomes REQUIRED
   - User will become org_admin

5. **Validation**
   - Cannot proceed to next step without:
     - Confirming join (if existing org)
     - OR entering firm name (if new org)

## Code Examples

### Frontend: Check Domain on Blur

```typescript
const checkFirmDomain = async (website: string) => {
  setCheckingDomain(true);
  
  const response = await fetch('/api/auth/check-firm-domain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ website }),
  });

  const data = await response.json();

  if (data.exists) {
    setExistingOrg({
      name: data.organization.name,
      website: data.organization.website,
    });
    toast.info(`Found existing organization: ${data.organization.name}`);
  } else {
    setExistingOrg(null);
    toast.success('No existing organization found - you\'ll create a new one');
  }
  
  setCheckingDomain(false);
};
```

### Backend: Create Organization with Display Name

```typescript
const [newOrg] = await db
  .insert(organizations)
  .values({
    name: validatedData.firmName,
    displayName: validatedData.firmName, // Same as name initially
    type: 'law_firm',
    website: validatedData.firmWebsite,
    domainKey: normalizeDomain(validatedData.firmWebsite),
    contactEmail: validatedData.email,
  })
  .returning();
```

## Benefits

### 1. **Prevents Mistakes**
- Attorney sees the organization name before joining
- Confirms they're joining the correct firm
- Reduces accidental joins

### 2. **Better UX**
- Visual feedback (green for existing, yellow for new)
- Clear instructions at each step
- Loading states for async operations

### 3. **Name Validation**
- Organization names are user-friendly
- Display names can be updated without breaking domain matching
- Supports future features (search by name, firm profiles)

### 4. **Flexibility**
- `alternativeDomains` field supports:
  - Firms with multiple websites
  - Domain changes after rebranding
  - Mergers and acquisitions

### 5. **Data Quality**
- Required firm name ensures meaningful organization names
- Display names improve admin interfaces
- Better analytics and reporting

## Testing Scenarios

### Test 1: First Attorney from a Firm

1. Go to `/admin/attorneys/onboard`
2. Select "Part of a Law Firm"
3. Enter website: `newlawfirm.com`
4. Leave field → See "New Organization" message
5. Enter firm name: "New Law Firm LLC"
6. Complete signup

**Expected:**
- New organization created
- `name`: "New Law Firm LLC"
- `displayName`: "New Law Firm LLC"
- `domainKey`: "newlawfirm.com"
- User role: `org_admin`

### Test 2: Second Attorney Joining Same Firm

1. Go to `/admin/attorneys/onboard`
2. Select "Part of a Law Firm"
3. Enter website: `newlawfirm.com` (same as above)
4. Leave field → See "Organization Found!" with firm name
5. Check confirmation box
6. Complete signup

**Expected:**
- NO new organization created
- Joined existing "New Law Firm LLC"
- User role: `attorney`

### Test 3: Attorney Changes Mind

1. Enter website that matches existing org
2. See confirmation box
3. Click back or change website to different value
4. Confirmation box disappears
5. Can enter different website or switch to solo

**Expected:**
- UI resets when website changes
- Checkbox unchecked
- Can proceed with different choice

### Test 4: Validation Errors

**Scenario A: Existing org, no confirmation**
- Enter website matching existing org
- Don't check confirmation box
- Try to proceed → Error: "Please confirm you want to join..."

**Scenario B: New org, no name**
- Enter website not matching any org
- Don't enter firm name
- Try to proceed → Error: "Please enter your law firm's name"

## Future Enhancements

### 1. Alternative Domains Support

Allow org admins to add alternative domains:

```typescript
// In organization settings
await db
  .update(organizations)
  .set({
    alternativeDomains: ['old-domain.com', 'subdomain.newdomain.com']
  })
  .where(eq(organizations.id, orgId));
```

Then update check-firm-domain API to also search alternative domains:

```typescript
const [existingOrg] = await db
  .select()
  .from(organizations)
  .where(
    or(
      eq(organizations.domainKey, domainKey),
      sql`${domainKey} = ANY(${organizations.alternativeDomains})`
    )
  );
```

### 2. Email Domain Validation (Optional)

Warn if email domain doesn't match firm website:

```typescript
const emailDomain = email.split('@')[1];
if (emailDomain !== domainKey && !isCommonProvider(emailDomain)) {
  // Show warning: "Your email domain doesn't match firm website"
}
```

### 3. Admin Approval Workflow

Add pending join requests that org_admin must approve:

```sql
CREATE TABLE organization_join_requests (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  attorney_email TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP
);
```

### 4. Firm Profile Page

Allow firms to customize their profile:
- Logo
- Description
- Practice areas
- Office locations
- Custom display name

## Files Modified

1. `src/lib/db/schema.ts` - Added displayName and alternativeDomains fields
2. `migrations/add_organization_display_fields.sql` - Database migration
3. `src/app/api/auth/check-firm-domain/route.ts` - NEW: Domain check endpoint
4. `src/app/api/auth/attorney-signup/route.ts` - Enhanced with confirmation flow
5. `src/app/admin/attorneys/onboard/page.tsx` - Enhanced UI with confirmation step

## Database Queries

### Find Organization by Domain or Alternative Domains

```typescript
import { sql, or, eq } from 'drizzle-orm';

const [org] = await db
  .select()
  .from(organizations)
  .where(
    or(
      eq(organizations.domainKey, searchDomain),
      sql`${searchDomain} = ANY(${organizations.alternativeDomains})`
    )
  )
  .limit(1);
```

### Update Display Name

```typescript
await db
  .update(organizations)
  .set({ 
    displayName: 'New Friendly Name',
    updatedAt: new Date()
  })
  .where(eq(organizations.id, orgId));
```

### Get All Firms with Attorney Count

```typescript
const firmsWithCounts = await db
  .select({
    id: organizations.id,
    name: organizations.displayName,
    website: organizations.website,
    attorneyCount: sql<number>`COUNT(${users.id})`,
  })
  .from(organizations)
  .leftJoin(users, eq(users.organizationId, organizations.id))
  .where(eq(organizations.type, 'law_firm'))
  .groupBy(organizations.id);
```

## Support

For questions or issues:
- See original implementation: `docs/FIRM_ORGANIZATION_IMPLEMENTATION.md`
- Database schema: `src/lib/db/schema.ts`
- Super admin docs: `docs/SUPER_ADMIN_IMPLEMENTATION.md`

