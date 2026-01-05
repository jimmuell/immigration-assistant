# Solo Attorney Workflow Fix

## Problem Statement

Two critical UX issues were identified:

### Issue #1: Redundant Team Management Location
- Team management was created as a separate page at `/admin/team`
- Already had user management at `/admin/users` with tabs
- Created redundancy and poor navigation

### Issue #2: Solo Attorneys Locked Out of Attorney Features ⚠️ CRITICAL
- Solo attorneys sign up → get `org_admin` role  
- Middleware redirects org_admin → `/admin` dashboard
- Attorney pages checked for old `'admin'` role (renamed to `'org_admin'`)
- **Result**: Solo attorneys couldn't access:
  - Attorney dashboard
  - Assigned screenings
  - Submit quotes
  - Pending/accepted quotes
  - Client communication
  - Active cases

## Solution Implemented

### 1. Updated All Attorney Pages to Allow org_admin Access

**Files Modified:**
- `src/app/attorney/page.tsx` - Main dashboard
- `src/app/attorney/cases/page.tsx` - Active cases
- `src/app/attorney/pending-quotes/page.tsx` - Pending quotes
- `src/app/attorney/accepted-quotes/page.tsx` - Accepted quotes
- `src/app/attorney/new-screenings/page.tsx` - New screenings
- `src/app/attorney/screenings/[id]/page.tsx` - Screening details
- `src/app/attorney/screenings/[id]/actions.ts` - Server actions

**Changes:**
```typescript
// Before
await requireRole(['attorney', 'admin']);

// After
await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
```

### 2. Created Dashboard Switcher Component

**File**: `src/components/dashboard-switcher.tsx`

**Purpose**: Allows users who have both admin and attorney capabilities to easily switch between dashboards.

**Features**:
- Shows only if user can access both dashboards
- Highlights current dashboard
- Clean toggle design
- Positioned prominently for easy access

**Logic**:
- `canAccessAttorney`: User is attorney OR has attorney profile
- `canAccessAdmin`: User is org_admin, staff, or super_admin
- Shows switcher only if BOTH are true

### 3. Integrated Team Management into /admin/users

**Created**: `src/components/admin/team-tab-content.tsx`

**Modified**: `src/app/admin/users/page.tsx`

**Changes**:
- Added "Team" tab to existing user management tabs
- Tab shows count of staff members
- Integrated team invite/remove functionality
- Consistent with existing UI patterns

**Tab Order**: Attorneys → Team → Clients → Admins

### 4. Updated Middleware Routing

**File**: `src/middleware.ts`

**Changes**:
```typescript
// Attorney pages now accessible to staff too
if (isAttorneyPage && userRole !== 'attorney' && userRole !== 'org_admin' && userRole !== 'staff' && userRole !== 'super_admin') {
  return NextResponse.redirect(new URL("/", req.url));
}
```

## How It Works Now

### Solo Attorney Workflow

```
Solo Attorney Signs Up
    ↓
Gets role: 'org_admin'
    ↓
Can choose to go to:
    ├─ /admin → Manage practice (users, flows, screenings)
    └─ /attorney → Handle cases (quotes, client messages)
    ↓
Dashboard Switcher
    ├─ Admin: Managing Practice
    └─ Attorney: Handling Cases
```

### With Staff Members

```
Solo Attorney (org_admin)
    ↓
Navigate to /admin/users → Team tab
    ↓
Invite Staff Member
    ├─ Role: Staff (paralegal/secretary)
    └─ Role: Attorney
    ↓
Staff Member Can Access:
    ✅ /admin dashboard
    ✅ /attorney dashboard (same as org_admin)
    ✅ All case management features
    ✅ Submit quotes, communicate with clients
    ❌ Cannot invite/remove team (org_admin only)
```

## Role Access Matrix

| Feature | Client | Attorney | org_admin | Staff | super_admin |
|---------|--------|----------|-----------|-------|-------------|
| Client Portal | ✅ | ✅ | ✅ | ✅ | ✅ |
| Attorney Dashboard | ❌ | ✅ | ✅ | ✅ | ✅ |
| Handle Cases & Quotes | ❌ | ✅ | ✅ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Flows | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ | ✅ | ✅ |
| Invite Team Members | ❌ | ❌ | ✅ | ❌ | ✅ |
| Remove Team Members | ❌ | ❌ | ✅ | ❌ | ✅ |
| Super Admin Features | ❌ | ❌ | ❌ | ❌ | ✅ |

## User Stories

### Story 1: Solo Attorney with No Staff

**User**: John, solo immigration attorney

**Flow**:
1. Signs up at `/admin/attorneys/onboard`
2. Gets `org_admin` role
3. Logs in → redirected to `/admin`
4. Sees Dashboard Switcher (top of page)
5. Clicks "Attorney" → goes to `/attorney`
6. Can view assigned screenings, submit quotes
7. Clicks "Admin" → goes back to `/admin`
8. Can manage flows, view all screenings

### Story 2: Solo Attorney Invites Paralegal

**User**: Sarah, solo attorney with paralegal Maria

**Flow**:
1. Sarah (org_admin) goes to `/admin/users`
2. Clicks "Team" tab
3. Clicks "Invite Team Member"
4. Enters Maria's details, selects "Staff" role
5. Gets temporary password
6. Shares credentials with Maria
7. Maria logs in → redirected to `/admin`
8. Maria can:
   - Access `/admin` dashboard
   - Access `/attorney` dashboard
   - Manage screenings and quotes
   - Cannot invite/remove team members

### Story 3: Law Firm with Multiple Attorneys

**User**: Law firm with 3 attorneys

**Flow**:
1. First attorney signs up → creates firm → becomes `org_admin`
2. Invites 2 more attorneys (role: `attorney`)
3. Those attorneys can:
   - Access `/attorney` dashboard
   - Handle their assigned cases
   - Cannot access `/admin` (no org_admin role)
4. Org admin can:
   - Access both `/admin` and `/attorney`
   - Manage firm, flows, users
   - Handle their own cases

## Files Modified

### Attorney Access
1. ✅ `src/app/attorney/page.tsx`
2. ✅ `src/app/attorney/cases/page.tsx`
3. ✅ `src/app/attorney/pending-quotes/page.tsx`
4. ✅ `src/app/attorney/accepted-quotes/page.tsx`
5. ✅ `src/app/attorney/new-screenings/page.tsx`
6. ✅ `src/app/attorney/screenings/[id]/page.tsx`
7. ✅ `src/app/attorney/screenings/[id]/actions.ts`

### Middleware & Routing
8. ✅ `src/middleware.ts`

### UI Components
9. ✅ `src/components/dashboard-switcher.tsx` - NEW
10. ✅ `src/components/admin/team-tab-content.tsx` - NEW
11. ✅ `src/app/admin/users/page.tsx` - Added Team tab

## Testing Checklist

### Test 1: Solo Attorney Can Access Attorney Dashboard
- [ ] Sign up as attorney
- [ ] Verify redirected to `/admin`
- [ ] Navigate to `/attorney`
- [ ] Verify can access attorney dashboard
- [ ] Verify can view screenings
- [ ] Verify can submit quotes

### Test 2: Dashboard Switcher Works
- [ ] Log in as org_admin
- [ ] Verify dashboard switcher appears
- [ ] Click "Attorney" button
- [ ] Verify redirected to `/attorney`
- [ ] Verify "Attorney" button highlighted
- [ ] Click "Admin" button
- [ ] Verify redirected to `/admin`
- [ ] Verify "Admin" button highlighted

### Test 3: Team Management in Users Page
- [ ] Log in as org_admin
- [ ] Navigate to `/admin/users`
- [ ] Verify "Team" tab exists
- [ ] Click "Team" tab
- [ ] Verify "Invite Team Member" button
- [ ] Click invite button
- [ ] Fill form, select "Staff" role
- [ ] Submit
- [ ] Verify temporary password shown
- [ ] Verify new staff member in list

### Test 4: Staff Member Access
- [ ] Log in as staff member
- [ ] Verify redirected to `/admin`
- [ ] Verify can access `/admin` features
- [ ] Navigate to `/attorney`
- [ ] Verify can access attorney features
- [ ] Verify dashboard switcher appears
- [ ] Verify CANNOT see "Invite Team Member" button

### Test 5: Regular Attorney (Not org_admin)
- [ ] Invite new attorney (role: attorney, NOT staff)
- [ ] Log in as that attorney
- [ ] Verify redirected to `/attorney`
- [ ] Verify can access attorney features
- [ ] Try to access `/admin`
- [ ] Verify BLOCKED (no dashboard switcher)

## Benefits

✅ **Dual Dashboard Access**: Solo attorneys can manage practice AND handle cases  
✅ **Staff Empowerment**: Paralegals get full access to help run the practice  
✅ **Consolidated UI**: Team management integrated into existing user management  
✅ **Clear Navigation**: Dashboard switcher makes it obvious where you are  
✅ **Backward Compatible**: Doesn't break existing attorney or multi-attorney firm workflows  
✅ **Proper Access Control**: Staff can work but can't modify team structure  

## Migration Notes

No data migration needed. Existing users work as before:
- Existing `attorney` users → still access `/attorney`
- Existing `org_admin` users → now can access BOTH `/admin` and `/attorney`
- New `staff` users → can access both dashboards

## Future Enhancements

1. **Attorney Profile Detection**: Check if org_admin has attorney profile to determine dashboard switcher visibility
2. **Default Dashboard Preference**: Let users set their preferred default dashboard
3. **Dashboard Notifications**: Show badge counts on switcher buttons (e.g., "3 new screenings")
4. **Quick Actions**: Add dropdown menus to switcher for common actions
5. **Role-Based Dashboard Customization**: Different widgets based on primary role

## Support

For questions:
- See: `docs/TEAM_MANAGEMENT.md` for team/staff features
- See: `docs/FIRM_ORGANIZATION_IMPLEMENTATION.md` for firm structure
- See: `docs/SUPER_ADMIN_IMPLEMENTATION.md` for roles overview

