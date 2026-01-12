# Super Admin Screenings Redirect Fix

## Issue

When logged in as a super admin and completing a flow, clicking "Screenings" in the sidebar would briefly show `/admin/intake` and then automatically redirect to `/super-admin`.

## Root Cause

The sidebar was showing admin navigation items (including "Screenings" → `/admin/intakes`) to super admins even when they weren't viewing a specific organization. When clicked, the `/admin/intakes` page requires an organization context via `requireOrganizationContext()`, which super admins don't have by default. This triggered a redirect back to `/super-admin`.

## Solution

Updated the `DesktopSidebar` component to conditionally hide admin menu items for super admins who are not actively viewing an organization:

1. **Added state tracking**: Added `isViewingOrg` state to track whether a super admin is viewing an organization
2. **Created API endpoint**: Created `/api/super-admin/check-viewing-org` to check the organization viewing status
3. **Updated filtering logic**: Modified the navigation items filter to hide admin menu items when `userRole === 'super_admin' && !isViewingOrg`

## Files Changed

- `src/components/desktop-sidebar.tsx` - Added organization viewing check and updated filter logic
- `src/app/api/super-admin/check-viewing-org/route.ts` - New API endpoint to check viewing status

## Expected Behavior

### Before Fix
- Super admin sees all admin menu items in sidebar
- Clicking "Screenings" causes redirect loop: `/admin/intakes` → `/super-admin`

### After Fix
- Super admin only sees super admin menu items when not viewing an organization
- When viewing an organization (via "View as Admin" button), admin menu items appear
- No redirect loop - proper navigation to intended pages

## Design Pattern

This follows the established super admin design pattern:
- Super admins manage the platform at the `/super-admin` level
- To view organization-specific data, they use "View as Admin" context switching
- Admin navigation items only appear when in organization viewing context
- A blue banner appears indicating "Viewing as Organization Admin"
- Click "Return to Super Admin" to exit organization context

## Related Documentation

- `docs/implementation/SUPER_ADMIN_IMPLEMENTATION.md` - Super admin architecture
- `src/lib/organization-context.ts` - Organization context switching utilities

## Date Fixed

January 12, 2026
