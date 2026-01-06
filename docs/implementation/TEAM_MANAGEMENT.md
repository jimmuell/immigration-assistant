# Team Management Feature

## Overview

The Team Management feature allows solo attorneys and law firm administrators to invite and manage support staff (paralegals, secretaries) and other attorneys to help run their practice. Staff members receive the same administrative access as organization admins, enabling them to manage clients, screenings, and quotes.

## Problem Solved

**Scenario**: A solo attorney signs up and wants a paralegal or secretary to help manage the practice.

**Previous Issue**: Only the attorney (org_admin) could access `/admin` routes. No way to add support staff.

**Solution**: Introduced a new `staff` role with full admin access, plus team management features.

## Database Changes

### New Role: `staff`

Updated the `users` table role constraint:

```sql
-- Before
role CHECK (role IN ('client', 'attorney', 'org_admin', 'super_admin'))

-- After  
role CHECK (role IN ('client', 'attorney', 'org_admin', 'staff', 'super_admin'))
```

**Migration**: `migrations/add_staff_role.sql`

## Role Permissions

| Role | Access Level | Description |
|------|--------------|-------------|
| `org_admin` | Full admin + team management | Practice owner, can invite/remove team members |
| `staff` | Full admin access | Paralegal/secretary, manages practice but can't invite others |
| `attorney` | Attorney dashboard | Handles cases, quotes, client interactions |
| `client` | Client portal | Uses the immigration assistant |
| `super_admin` | Platform admin | Manages all organizations |

## Features

### 1. Team Management Dashboard (`/admin/team`)

**Access**: Only `org_admin` and `staff` can view

**Features**:
- View all team members
- See member roles and join dates
- Invite new team members
- Remove team members (org_admin only)

### 2. Invite Team Members

**Who Can Invite**: Only `org_admin`

**Process**:
1. Admin goes to `/admin/team`
2. Clicks "Invite Team Member"
3. Fills in:
   - Name
   - Email
   - Role (Staff or Attorney)
4. System generates temporary password
5. Admin receives password to share with new member

**API Endpoint**: `POST /api/admin/team/invite`

**Request**:
```json
{
  "email": "paralegal@example.com",
  "name": "Jane Smith",
  "role": "staff"
}
```

**Response**:
```json
{
  "message": "Team member invited successfully",
  "user": {
    "id": "uuid",
    "email": "paralegal@example.com",
    "name": "Jane Smith",
    "role": "staff"
  },
  "tempPassword": "RandomPass123!"
}
```

### 3. Remove Team Members

**Who Can Remove**: Only `org_admin`

**Restrictions**:
- Cannot remove yourself
- Cannot remove other org_admins
- Can remove staff and attorneys

**API Endpoint**: `DELETE /api/admin/team?userId=<uuid>`

### 4. List Team Members

**Who Can View**: `org_admin` and `staff`

**API Endpoint**: `GET /api/admin/team`

**Response**:
```json
{
  "teamMembers": [
    {
      "id": "uuid",
      "email": "paralegal@example.com",
      "name": "Jane Smith",
      "role": "staff",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Middleware Updates

Updated `/src/middleware.ts` to allow `staff` role access to `/admin` routes:

```typescript
// Before
if (isAdminPage && userRole !== 'org_admin' && userRole !== 'super_admin') {
  return NextResponse.redirect(new URL("/", req.url));
}

// After
if (isAdminPage && userRole !== 'org_admin' && userRole !== 'staff' && userRole !== 'super_admin') {
  return NextResponse.redirect(new URL("/", req.url));
}
```

Staff users are redirected to `/admin` on login, just like org_admins.

## Type Definitions Updated

### Files Modified:
1. `src/lib/db/schema.ts` - Added 'staff' to role enum
2. `src/types/next-auth.d.ts` - Updated Session, User, JWT types
3. `src/lib/role-middleware.ts` - Updated UserRole type
4. `src/lib/organization-context.ts` - Updated UserRole type
5. `src/middleware.ts` - Added staff access checks

## Usage Flow

### For Solo Attorney (org_admin)

```
1. Solo attorney signs up
   → Creates organization
   → Becomes org_admin

2. Navigate to /admin/team
   → Clicks "Invite Team Member"

3. Enter paralegal details:
   ├─ Email: sarah@example.com
   ├─ Name: Sarah Johnson
   └─ Role: Staff

4. Click "Send Invitation"
   → System generates temp password
   → Shows password to copy

5. Share credentials with paralegal:
   ├─ Email: sarah@example.com
   └─ Password: [temp password]

6. Paralegal logs in:
   → Redirected to /admin
   → Has full admin access
   → Can manage clients, screenings, quotes
   → CANNOT invite/remove team members
```

### For Staff Member

```
1. Receives credentials from org_admin

2. Logs in at /login
   → Redirected to /admin dashboard

3. Has access to:
   ✓ Admin dashboard
   ✓ Client management
   ✓ Screening management
   ✓ Quote management
   ✓ Flow management
   ✓ Team member list (view only)
   
4. Does NOT have access to:
   ✗ Inviting new team members
   ✗ Removing team members
   ✗ Super admin features
```

## Security Features

### 1. **Role-Based Access Control**
- Only `org_admin` can invite/remove team members
- Staff can view but not modify team
- All actions scoped to organization

### 2. **Organization Scoping**
- Team members can only be added to same organization
- Cannot remove members from other organizations
- Automatic organization filtering

### 3. **Self-Protection**
- Cannot remove yourself
- Cannot remove org_admins

### 4. **Temporary Passwords**
- Random 12-character passwords generated
- Must be changed on first login (recommended future feature)

## Future Enhancements

### 1. Email Notifications
Replace temporary password display with email sending:

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: validatedData.email,
  subject: 'You've been invited to join [Firm Name]',
  template: 'team-invitation',
  data: {
    firmName: session.user.organizationName,
    tempPassword: tempPassword,
    loginUrl: `${process.env.NEXT_PUBLIC_URL}/login`
  }
});
```

### 2. Password Reset on First Login
Force users to change password on first login:

```typescript
// Add to users table
firstLoginComplete: boolean().default(false)

// Check in auth
if (!user.firstLoginComplete) {
  redirect('/change-password');
}
```

### 3. Role Permissions System
More granular permissions instead of all-or-nothing access:

```typescript
permissions = {
  view_clients: boolean,
  manage_clients: boolean,
  view_quotes: boolean,
  create_quotes: boolean,
  manage_flows: boolean,
}
```

### 4. Audit Log
Track who does what:

```typescript
team_activity_log = {
  userId: uuid,
  action: 'invited' | 'removed' | 'updated',
  targetUserId: uuid,
  timestamp: timestamp
}
```

## Testing

### Test Case 1: Invite Staff Member

1. Log in as org_admin
2. Navigate to `/admin/team`
3. Click "Invite Team Member"
4. Fill form:
   - Email: test@example.com
   - Name: Test User
   - Role: Staff
5. Click "Send Invitation"
6. Copy temporary password
7. Log out
8. Log in with test@example.com and temp password
9. Verify redirected to `/admin`
10. Verify can access all admin features

### Test Case 2: Staff Cannot Invite

1. Log in as staff member
2. Navigate to `/admin/team`
3. Verify "Invite Team Member" button is NOT visible
4. Try API call: `POST /api/admin/team/invite`
5. Verify returns 403 Unauthorized

### Test Case 3: Remove Team Member

1. Log in as org_admin
2. Navigate to `/admin/team`
3. Find staff member in table
4. Click "Remove" button
5. Confirm deletion
6. Verify member removed from list
7. Log out
8. Try to log in as removed member
9. Verify login still works but data is scoped

### Test Case 4: Multiple Staff Members

1. Invite multiple staff (3+)
2. Verify all appear in team list
3. Verify each has unique role badge
4. Verify all have access to admin dashboard
5. Verify none can invite others

## API Reference

### POST /api/admin/team/invite

Invite a new team member.

**Auth Required**: Yes (org_admin only)

**Request Body**:
```typescript
{
  email: string;
  name: string;
  role: 'staff' | 'attorney';
}
```

**Success Response** (201):
```typescript
{
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tempPassword: string; // Remove in production
}
```

**Error Responses**:
- 400: Validation error or user already exists
- 403: Unauthorized (not org_admin)
- 500: Server error

### GET /api/admin/team

List all team members in the organization.

**Auth Required**: Yes (org_admin or staff)

**Success Response** (200):
```typescript
{
  teamMembers: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
}
```

**Error Responses**:
- 403: Unauthorized
- 500: Server error

### DELETE /api/admin/team?userId=<uuid>

Remove a team member from the organization.

**Auth Required**: Yes (org_admin only)

**Query Parameters**:
- `userId`: UUID of user to remove

**Success Response** (200):
```typescript
{
  message: "Team member removed successfully"
}
```

**Error Responses**:
- 400: Cannot remove yourself or org_admin
- 403: Unauthorized
- 404: User not found
- 500: Server error

## Files Changed

1. ✅ `src/lib/db/schema.ts` - Added 'staff' role
2. ✅ `migrations/add_staff_role.sql` - Database migration
3. ✅ `src/middleware.ts` - Allow staff access to /admin
4. ✅ `src/types/next-auth.d.ts` - Updated type definitions
5. ✅ `src/lib/role-middleware.ts` - Updated UserRole type
6. ✅ `src/lib/organization-context.ts` - Updated UserRole type
7. ✅ `src/app/api/admin/team/invite/route.ts` - NEW: Invite endpoint
8. ✅ `src/app/api/admin/team/route.ts` - NEW: List/remove endpoint
9. ✅ `src/app/admin/team/page.tsx` - NEW: Team management UI

## Support

For questions or issues:
- See: `docs/SUPER_ADMIN_IMPLEMENTATION.md` for organization structure
- See: `docs/FIRM_ORGANIZATION_IMPLEMENTATION.md` for firm matching
- See: `docs/ENHANCED_FIRM_MATCHING.md` for domain-based matching
- Database schema: `src/lib/db/schema.ts`

