# Law Firm Organization Implementation

## Overview

This document describes the implementation of the website domain-based organization matching system that allows multiple attorneys from the same law firm to be automatically grouped together while maintaining strict data privacy between competing firms.

## Problem Solved

Previously, when attorneys signed up, each created their own separate organization, even if they worked at the same firm. This made it impossible to:
- Group attorneys from the same firm together
- Share clients and cases within a firm
- Maintain firm-level administration

## Solution

We implemented a **website domain-based organization matching system** that:
1. Asks attorneys during signup whether they're solo or part of a firm
2. For firm attorneys, collects the firm's website URL
3. Automatically groups attorneys with matching website domains into the same organization
4. Maintains complete data isolation between different firms

## Database Changes

### Schema Updates

Added two new fields to the `organizations` table:

```sql
ALTER TABLE organizations ADD COLUMN website TEXT;
ALTER TABLE organizations ADD COLUMN domain_key TEXT UNIQUE;
CREATE INDEX organizations_domain_key_idx ON organizations(domain_key);
```

**Fields:**
- `website`: The firm's website URL (e.g., "https://smithlaw.com")
- `domain_key`: Normalized domain for matching (e.g., "smithlaw.com"), UNIQUE constraint ensures one org per domain

### Migration File

Location: `migrations/add_organization_website_domain.sql`

## Implementation Details

### 1. Attorney Signup Schema (`src/app/api/auth/attorney-signup/route.ts`)

**New fields:**
```typescript
firmType: 'solo' | 'part_of_firm'
firmWebsite: string (required if part_of_firm)
firmName: string (optional, for first attorney creating the firm)
```

**Logic flow:**

```
Attorney signs up
    ↓
Select practice type
    ↓
If SOLO:
    - Create new organization (type: 'solo_attorney')
    - Attorney becomes org_admin
    - No domain_key set

If PART_OF_FIRM:
    - Normalize the website domain
    - Check if organization with that domain_key exists
    ↓
    If EXISTS:
        - Join existing organization
        - Role: 'attorney'
    If NOT EXISTS:
        - Create new organization (type: 'law_firm')
        - Set domain_key to normalized domain
        - First attorney becomes 'org_admin'
```

### 2. Domain Normalization

The `normalizeDomain()` function ensures consistent matching:

```typescript
function normalizeDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.replace(/^www\./, '').toLowerCase();
  }
}
```

**Examples:**
- `https://smithlaw.com` → `smithlaw.com`
- `www.smithlaw.com` → `smithlaw.com`
- `SMITHLAW.COM` → `smithlaw.com`
- `smithlaw.com/about` → `smithlaw.com`

### 3. UI Updates (`src/app/admin/attorneys/onboard/page.tsx`)

**Step 1: Basic Information**
- Added radio button selection for practice type
- Conditionally show firm website and name fields
- Added validation requiring website for firm attorneys

**Features:**
- Clear visual distinction between solo and firm options
- Helpful explanatory text
- Real-time validation

## Privacy & Data Isolation

### How Data Privacy is Maintained

1. **Organization-Scoped Queries**: All data queries filter by `organizationId`
   ```typescript
   const screenings = await db
     .select()
     .from(screenings)
     .where(eq(screenings.organizationId, session.user.organizationId));
   ```

2. **Unique Domain Keys**: Each firm has ONE unique domain_key, preventing cross-contamination

3. **Separate Organizations**: Competing firms will have different domain names and therefore different organizations

4. **Row-Level Security**: Every resource (screenings, flows, conversations, quotes) is tied to an organization

### Example Scenario

**Firm A: Smith & Associates (smithlaw.com)**
- Attorney John signs up → Creates org with domain_key: "smithlaw.com", becomes org_admin
- Attorney Jane signs up with smithlaw.com → Joins existing org as attorney
- Attorney Bob signs up with smithlaw.com → Joins existing org as attorney

**Firm B: Jones Legal (joneslegal.com)**
- Attorney Mary signs up → Creates org with domain_key: "joneslegal.com", becomes org_admin
- Attorney Tom signs up with joneslegal.com → Joins existing org as attorney

**Result:**
- Smith & Associates: 3 attorneys in one organization
- Jones Legal: 2 attorneys in one organization
- Complete data isolation between firms
- No way for Firm A to see Firm B's data (different organizationId)

## Role Assignment

| Scenario | Role Assigned | Explanation |
|----------|---------------|-------------|
| Solo attorney | `org_admin` | They manage their own practice |
| First firm attorney | `org_admin` | They set up the firm and can onboard others |
| Subsequent firm attorneys | `attorney` | Regular attorneys joining an existing firm |

## API Response

The signup endpoint now returns additional information:

```json
{
  "message": "Attorney account created successfully",
  "isNewOrganization": true,  // or false if joined existing
  "role": "org_admin",         // or "attorney"
  "user": {
    "id": "uuid",
    "email": "john@smithlaw.com",
    "name": "John Smith",
    "role": "org_admin"
  }
}
```

## Testing the Implementation

### Test Case 1: Solo Attorney
1. Navigate to `/admin/attorneys/onboard`
2. Select "Solo Attorney / Independent Practice"
3. Fill in email, name, password
4. Complete professional details
5. Submit

**Expected:**
- New organization created with type `solo_attorney`
- Attorney becomes `org_admin`
- No domain_key set

### Test Case 2: First Firm Attorney
1. Navigate to `/admin/attorneys/onboard`
2. Select "Part of a Law Firm"
3. Enter firm website: "smithlaw.com"
4. Enter firm name: "Smith & Associates"
5. Complete signup

**Expected:**
- New organization created with type `law_firm`
- domain_key set to "smithlaw.com"
- Attorney becomes `org_admin`

### Test Case 3: Second Firm Attorney (Same Firm)
1. Navigate to `/admin/attorneys/onboard`
2. Select "Part of a Law Firm"
3. Enter firm website: "smithlaw.com" (same as above)
4. Complete signup

**Expected:**
- NO new organization created
- Attorney joins existing "Smith & Associates" organization
- Attorney role is `attorney` (not org_admin)

### Test Case 4: Competing Firm
1. Navigate to `/admin/attorneys/onboard`
2. Select "Part of a Law Firm"
3. Enter firm website: "joneslegal.com" (different)
4. Complete signup

**Expected:**
- New organization created (different from Smith & Associates)
- Complete data isolation from other firms

## Benefits

✅ **Automatic Firm Grouping**: Attorneys from the same firm are automatically grouped
✅ **No Manual Admin Approval**: Streamlined signup process
✅ **Privacy Protected**: Different firms cannot access each other's data
✅ **Flexible**: Supports both solo attorneys and law firms
✅ **Scalable**: First attorney becomes admin, can manage others
✅ **User-Friendly**: Simple website field instead of complex email matching
✅ **Reliable**: Website domains are stable and unique identifiers

## Future Enhancements (Optional)

1. **Admin Approval Workflow**: Require org_admin approval for attorneys joining existing firms
2. **Firm Profile Page**: Allow firms to manage their branding and information
3. **Email Notifications**: Notify org_admin when new attorneys join
4. **Domain Verification**: Verify attorneys actually work at the firm (email domain matching)
5. **Bulk Attorney Import**: Allow org_admins to bulk invite attorneys

## Files Changed

1. `src/lib/db/schema.ts` - Added website and domainKey fields to organizations table
2. `migrations/add_organization_website_domain.sql` - Database migration
3. `src/app/api/auth/attorney-signup/route.ts` - Updated signup logic with domain matching
4. `src/app/admin/attorneys/onboard/page.tsx` - Updated UI with firm selection
5. `scripts/add-org-website-domain.ts` - Migration runner script

## Database Query Examples

**Find all attorneys in a firm:**
```typescript
const firmAttorneys = await db
  .select()
  .from(users)
  .innerJoin(organizations, eq(users.organizationId, organizations.id))
  .where(eq(organizations.domainKey, 'smithlaw.com'));
```

**Check if domain already exists:**
```typescript
const existingOrg = await db
  .select()
  .from(organizations)
  .where(eq(organizations.domainKey, 'smithlaw.com'))
  .limit(1);
```

**Get all organizations (excluding solo attorneys):**
```typescript
const firms = await db
  .select()
  .from(organizations)
  .where(eq(organizations.type, 'law_firm'));
```

## Support

For questions or issues with this implementation, refer to:
- This documentation
- `src/docs/SUPER_ADMIN_IMPLEMENTATION.md` for multi-tenancy overview
- Database schema: `src/lib/db/schema.ts`

