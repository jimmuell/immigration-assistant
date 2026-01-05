# Super Admin Role Testing Plan

## Overview
This test plan covers all functionality available to users with the `super_admin` role. Super admins have platform-wide access to manage all organizations, users, and system settings. They have the highest level of permissions in the system.

## Test Environment Setup
- Test super_admin user: `superadmin@test.com`
- Multiple test organizations
- Test users in various roles across organizations
- Platform-wide test data

---

## 1. Super Admin Dashboard Tests

### 1.1 Dashboard Access and Display
**Test ID:** SUPERADMIN-001  
**Role:** super_admin  
**Steps:**
1. Log in as super_admin
2. Verify redirect to `/super-admin` dashboard
3. Verify dashboard displays:
   - Platform overview header
   - Stats cards (Organizations, Total Clients, Total Attorneys, Total Screenings)
   - Organizations list table
   - "New Organization" button
4. Verify all platform-wide statistics

**Expected Result:** Super admin dashboard displays with platform-wide overview

---

### 1.2 Platform Statistics Accuracy
**Test ID:** SUPERADMIN-002  
**Role:** super_admin  
**Steps:**
1. Query database for actual counts:
   - Total organizations
   - Total clients across all orgs
   - Total attorneys across all orgs
   - Total screenings across all orgs
2. Compare with dashboard stats
3. Verify all counts accurate

**Expected Result:** Dashboard statistics accurately reflect entire platform

---

### 1.3 Organizations List Display
**Test ID:** SUPERADMIN-003  
**Role:** super_admin  
**Steps:**
1. View organizations table on dashboard
2. Verify each organization shows:
   - Name
   - Type (law_firm, solo_attorney, non_legal, other)
   - Number of admins
   - Number of attorneys
   - Number of clients
   - Created date
   - Action buttons (Manage, View as Admin)
3. Verify all organizations listed

**Expected Result:** Complete list of all organizations with details

---

### 1.4 Organization Type Color Coding
**Test ID:** SUPERADMIN-004  
**Role:** super_admin  
**Steps:**
1. View organizations with different types
2. Verify color coding:
   - law_firm: blue
   - solo_attorney: purple
   - non_legal: green
   - other: gray
3. Verify visual distinction clear

**Expected Result:** Organization types visually distinguished

---

## 2. Organization Management Tests

### 2.1 View Organizations Page
**Test ID:** SUPERADMIN-005  
**Role:** super_admin  
**Steps:**
1. Navigate to `/super-admin/organizations`
2. Verify comprehensive organizations list
3. Verify sorting and filtering options
4. Verify pagination (if applicable)

**Expected Result:** Full organizations management page accessible

---

### 2.2 Create New Organization
**Test ID:** SUPERADMIN-006  
**Role:** super_admin  
**Steps:**
1. Click "New Organization"
2. Navigate to `/super-admin/organizations/create`
3. Fill in organization details:
   - Name: "Test Law Firm"
   - Display Name: "Test Law Firm LLC"
   - Type: law_firm
   - Website: "https://testlawfirm.com"
   - Contact Email: "contact@testlawfirm.com"
   - Contact Phone: "+1-555-0100"
   - Address: "123 Legal St, City, State"
4. Submit form
5. Verify organization created in database
6. Verify organization appears in list

**Expected Result:** Super admin can create new organizations

---

### 2.3 Create Organization - Domain Key Processing
**Test ID:** SUPERADMIN-007  
**Role:** super_admin  
**Steps:**
1. Create organization with website URL
2. Verify system extracts and normalizes domain key:
   - Input: "https://www.example-law.com"
   - Expected domain_key: "example-law.com"
3. Verify domain_key saved correctly
4. Verify used for attorney firm matching

**Expected Result:** Domain key properly processed and stored

---

### 2.4 View Organization Details
**Test ID:** SUPERADMIN-008  
**Role:** super_admin  
**Steps:**
1. Click "Manage" on an organization
2. Navigate to `/super-admin/organizations/[id]`
3. Verify displays:
   - All organization information
   - List of users in organization
   - List of admins
   - Stats (screenings, flows, etc.)
   - Edit button
   - Assign Admin button
   - Switch Context button

**Expected Result:** Complete organization details accessible

---

### 2.5 Edit Organization
**Test ID:** SUPERADMIN-009  
**Role:** super_admin  
**Steps:**
1. From organization details, click "Edit"
2. Navigate to `/super-admin/organizations/[id]/edit`
3. Modify organization details:
   - Display name
   - Contact information
   - Website
   - Type
4. Save changes
5. Verify updates saved to database
6. Verify changes reflected in lists and details

**Expected Result:** Super admin can edit organization information

---

### 2.6 Change Organization Type
**Test ID:** SUPERADMIN-010  
**Role:** super_admin  
**Steps:**
1. Edit organization
2. Change type from one to another (e.g., solo_attorney to law_firm)
3. Save changes
4. Verify type updated
5. Verify affects organization behavior appropriately

**Expected Result:** Organization type can be changed by super admin

---

### 2.7 Delete Organization
**Test ID:** SUPERADMIN-011  
**Role:** super_admin  
**Steps:**
1. Select organization with no data
2. Delete organization
3. Confirm deletion
4. Verify organization removed from database
5. Verify cascading deletes handled correctly

**Expected Result:** Super admin can delete organizations

---

### 2.8 Cannot Delete Organization with Data
**Test ID:** SUPERADMIN-012  
**Role:** super_admin  
**Steps:**
1. Attempt to delete organization with users/screenings
2. Verify warning message displays
3. Verify deletion blocked or requires special confirmation
4. Verify data integrity protected

**Expected Result:** System protects against accidental deletion of active organizations

---

### 2.9 Cannot Delete Platform Administration Org
**Test ID:** SUPERADMIN-013  
**Role:** super_admin  
**Steps:**
1. Attempt to delete "Platform Administration" organization
2. Verify deletion not allowed
3. Verify this is the system default organization

**Expected Result:** System organization cannot be deleted

---

## 3. Organization Admin Assignment Tests

### 3.1 View Organization Admins
**Test ID:** SUPERADMIN-014  
**Role:** super_admin  
**Steps:**
1. View organization details
2. See list of users with org_admin role
3. Verify admin information displayed

**Expected Result:** Organization admins clearly listed

---

### 3.2 Assign Admin to Organization
**Test ID:** SUPERADMIN-015  
**Role:** super_admin  
**Steps:**
1. From organization details, click "Assign Admin"
2. Navigate to `/super-admin/organizations/[id]/assign-admin`
3. Enter user details:
   - Email
   - Name
   - Generate temporary password
4. Submit
5. Verify org_admin user created
6. Verify assigned to organization
7. Verify user can log in and access admin dashboard

**Expected Result:** Super admin can create and assign org admins

---

### 3.3 Assign Existing User as Admin
**Test ID:** SUPERADMIN-016  
**Role:** super_admin  
**Steps:**
1. Create or identify existing user (client or attorney)
2. Promote user to org_admin role
3. Verify user role updated
4. Verify user gains admin access
5. Verify user retains access to previous data

**Expected Result:** Existing users can be promoted to org_admin

---

### 3.4 Unassign Admin from Organization
**Test ID:** SUPERADMIN-017  
**Role:** super_admin  
**Steps:**
1. View organization with multiple admins
2. Click "Unassign Admin" on one admin
3. Confirm unassignment
4. Choose action:
   - Delete user entirely
   - Or demote to different role
5. Verify admin removed/demoted
6. Verify organization still has at least one admin (if rule applies)

**Expected Result:** Super admin can unassign/remove org admins

---

### 3.5 Cannot Remove Last Admin
**Test ID:** SUPERADMIN-018  
**Role:** super_admin  
**Steps:**
1. Attempt to remove the only admin from organization
2. Verify warning message
3. Verify removal blocked
4. Verify organization must have at least one admin

**Expected Result:** System ensures each organization has at least one admin

---

## 4. Organization Context Switching Tests

### 4.1 Switch to Organization Context
**Test ID:** SUPERADMIN-019  
**Role:** super_admin  
**Steps:**
1. From organizations list, click "View as Admin"
2. Or click "Switch Context" button
3. Verify navigation to `/admin` dashboard
4. Verify super admin now sees that organization's data
5. Verify super admin can perform org_admin functions
6. Verify context indicator shows which org is active

**Expected Result:** Super admin can switch into organization context

---

### 4.2 Perform Org Admin Functions in Context
**Test ID:** SUPERADMIN-020  
**Role:** super_admin (in org context)  
**Steps:**
1. Switch to organization context
2. Perform org_admin functions:
   - Manage users
   - Assign screenings
   - Edit flows
   - Invite team members
3. Verify all actions work
4. Verify actions attributed to super admin
5. Verify data changes saved to correct organization

**Expected Result:** Super admin has full org_admin capabilities in context

---

### 4.3 View Organization Switcher
**Test ID:** SUPERADMIN-021  
**Role:** super_admin (in org context)  
**Steps:**
1. While in organization context, view organization switcher component
2. Verify shows current organization
3. Verify shows option to return to super admin view
4. Verify shows list of other organizations (if applicable)

**Expected Result:** Organization context clearly indicated with easy switching

---

### 4.4 Clear Organization Context
**Test ID:** SUPERADMIN-022  
**Role:** super_admin (in org context)  
**Steps:**
1. While in organization context, click "Clear Context" or "Back to Super Admin"
2. Verify redirect to `/super-admin` dashboard
3. Verify context cleared
4. Verify back to platform-wide view

**Expected Result:** Super admin can exit organization context

---

### 4.5 Context Persistence Across Sessions
**Test ID:** SUPERADMIN-023  
**Role:** super_admin  
**Steps:**
1. Switch to organization context
2. Note current context
3. Navigate to different pages within context
4. Refresh browser
5. Verify context persists
6. Log out and log back in
7. Verify context cleared on new session (or persists if designed that way)

**Expected Result:** Context behavior consistent and predictable

---

## 5. User Management Across Organizations

### 5.1 View All Platform Users
**Test ID:** SUPERADMIN-024  
**Role:** super_admin  
**Steps:**
1. Access platform-wide users view
2. Verify can see users from all organizations
3. Verify can filter by organization
4. Verify can search across all users

**Expected Result:** Super admin can view all users across platform

---

### 5.2 Filter Users by Organization
**Test ID:** SUPERADMIN-025  
**Role:** super_admin  
**Steps:**
1. Use organization filter
2. Select specific organization
3. Verify only users from that organization display

**Expected Result:** User filtering by organization works correctly

---

### 5.3 Edit Any User
**Test ID:** SUPERADMIN-026  
**Role:** super_admin  
**Steps:**
1. Select any user from any organization
2. Edit user details:
   - Name
   - Email
   - Role
   - Organization
3. Save changes
4. Verify updates applied

**Expected Result:** Super admin can edit any user

---

### 5.4 Change User's Organization
**Test ID:** SUPERADMIN-027  
**Role:** super_admin  
**Steps:**
1. Select user from Organization A
2. Change organization to Organization B
3. Save change
4. Verify user moved to Organization B
5. Verify user's data handled appropriately
6. Verify user can access Organization B data
7. Verify user cannot access Organization A data anymore

**Expected Result:** Super admin can move users between organizations

---

### 5.5 Delete Any User
**Test ID:** SUPERADMIN-028  
**Role:** super_admin  
**Steps:**
1. Select any user
2. Delete user
3. Confirm deletion
4. Verify user deleted
5. Verify related data handled:
   - Screenings reassigned or marked
   - Messages preserved
   - Activity logs maintained

**Expected Result:** Super admin can delete any user with proper data handling

---

### 5.6 View User Activity Across Organizations
**Test ID:** SUPERADMIN-029  
**Role:** super_admin  
**Steps:**
1. Select user to view details
2. View user's activity:
   - Login history
   - Actions taken
   - Screenings involved
   - Messages sent
3. Verify comprehensive activity log

**Expected Result:** Super admin can view detailed user activity

---

## 6. Platform-Wide Data Access Tests

### 6.1 View All Screenings
**Test ID:** SUPERADMIN-030  
**Role:** super_admin  
**Steps:**
1. Access platform-wide screenings view
2. Verify can see screenings from all organizations
3. Verify can filter by organization
4. Verify complete data visibility

**Expected Result:** Super admin can view all screenings across platform

---

### 6.2 View All Flows
**Test ID:** SUPERADMIN-031  
**Role:** super_admin  
**Steps:**
1. Access platform-wide flows view
2. Verify can see flows from all organizations
3. Verify can view flow details
4. Verify read access to all flow structures

**Expected Result:** Super admin can view all flows

---

### 6.3 View Platform Analytics
**Test ID:** SUPERADMIN-032  
**Role:** super_admin  
**Steps:**
1. Access platform analytics dashboard
2. Verify metrics:
   - Total users by role
   - Growth trends
   - Screening volume
   - Organization activity
   - System performance metrics
3. Verify data accurate

**Expected Result:** Comprehensive platform analytics accessible

---

### 6.4 Export Platform Data
**Test ID:** SUPERADMIN-033  
**Role:** super_admin  
**Steps:**
1. Generate platform-wide reports
2. Export data:
   - All organizations
   - All users
   - All screenings
   - System logs
3. Verify export successful
4. Verify data complete and accurate

**Expected Result:** Super admin can export platform data

---

## 7. System Settings Tests (if applicable)

### 7.1 Access System Settings
**Test ID:** SUPERADMIN-034  
**Role:** super_admin  
**Steps:**
1. Navigate to system settings
2. Verify access granted
3. Verify settings available:
   - Email configuration
   - Storage settings
   - Security settings
   - Feature flags

**Expected Result:** Super admin can access system settings

---

### 7.2 Modify System Settings
**Test ID:** SUPERADMIN-035  
**Role:** super_admin  
**Steps:**
1. Change system setting
2. Save change
3. Verify setting updated
4. Verify change affects system behavior

**Expected Result:** Super admin can modify system settings

---

### 7.3 View System Logs
**Test ID:** SUPERADMIN-036  
**Role:** super_admin  
**Steps:**
1. Access system logs
2. View logs:
   - Error logs
   - Security logs
   - Activity logs
   - API logs
3. Filter logs by:
   - Date range
   - Log level
   - Organization
   - User

**Expected Result:** Comprehensive system logs accessible

---

## 8. Security and Audit Tests

### 8.1 View Audit Trail
**Test ID:** SUPERADMIN-037  
**Role:** super_admin  
**Steps:**
1. Access audit trail
2. View all administrative actions:
   - Organization creation/modification
   - User role changes
   - Data deletions
   - Permission changes
3. Verify actions timestamped and attributed
4. Verify audit trail immutable

**Expected Result:** Complete audit trail of platform actions

---

### 8.2 View Security Events
**Test ID:** SUPERADMIN-038  
**Role:** super_admin  
**Steps:**
1. Access security events log
2. View events:
   - Failed login attempts
   - Unauthorized access attempts
   - Suspicious activity
   - Data breaches (if any)
3. Verify real-time alerts available

**Expected Result:** Security events monitored and accessible

---

### 8.3 Manage Security Policies
**Test ID:** SUPERADMIN-039  
**Role:** super_admin  
**Steps:**
1. Access security policy settings
2. Modify policies:
   - Password requirements
   - Session timeout
   - MFA requirements
   - IP whitelisting
3. Verify policies enforced

**Expected Result:** Super admin can configure security policies

---

## 9. Super Admin Account Management

### 9.1 View Other Super Admins
**Test ID:** SUPERADMIN-040  
**Role:** super_admin  
**Steps:**
1. View list of super admin users
2. Verify all super admins listed
3. Verify super admin details visible

**Expected Result:** Super admins can view other super admin accounts

---

### 9.2 Create New Super Admin
**Test ID:** SUPERADMIN-041  
**Role:** super_admin  
**Steps:**
1. Create new user with super_admin role
2. Verify account created
3. Verify new super admin can log in
4. Verify new super admin has full permissions

**Expected Result:** Super admin can create other super admins

---

### 9.3 Cannot Delete Self
**Test ID:** SUPERADMIN-042  
**Role:** super_admin  
**Steps:**
1. Attempt to delete own account
2. Verify deletion blocked
3. Verify appropriate error message

**Expected Result:** Super admin cannot delete their own account

---

### 9.4 Cannot Delete Last Super Admin
**Test ID:** SUPERADMIN-043  
**Role:** super_admin  
**Steps:**
1. Ensure only one super admin exists
2. Attempt to delete the account
3. Verify deletion blocked
4. Verify platform must have at least one super admin

**Expected Result:** System ensures at least one super admin always exists

---

## 10. Access to Lower-Level Functions

### 10.1 Access Org Admin Functions
**Test ID:** SUPERADMIN-044  
**Role:** super_admin  
**Steps:**
1. Switch to organization context
2. Access `/admin` routes
3. Verify all org_admin functions available
4. Perform org_admin tasks
5. Verify all work correctly

**Expected Result:** Super admin has full org_admin capabilities

---

### 10.2 Access Attorney Functions
**Test ID:** SUPERADMIN-045  
**Role:** super_admin  
**Steps:**
1. Navigate to `/attorney` routes
2. Verify attorney dashboard accessible
3. Get screening assigned to super admin
4. Perform attorney functions
5. Verify all attorney features work

**Expected Result:** Super admin has full attorney capabilities

---

### 10.3 Cannot Access Client View Directly
**Test ID:** SUPERADMIN-046  
**Role:** super_admin  
**Steps:**
1. Attempt to access `/client` route
2. Verify redirect to `/super-admin`
3. Verify super admin doesn't see client-only view

**Expected Result:** Super admin redirected from client routes (or can access for testing)

---

## 11. Multi-Organization Operations

### 11.1 Bulk Operations on Organizations
**Test ID:** SUPERADMIN-047  
**Role:** super_admin  
**Steps:**
1. Select multiple organizations
2. Perform bulk action:
   - Activate/deactivate
   - Export data
   - Send notification
3. Verify action applied to all selected

**Expected Result:** Super admin can perform bulk operations

---

### 11.2 Copy Flow Between Organizations
**Test ID:** SUPERADMIN-048  
**Role:** super_admin  
**Steps:**
1. Select flow from Organization A
2. Copy flow to Organization B
3. Verify flow duplicated correctly
4. Verify Organization B can use flow

**Expected Result:** Super admin can share flows between organizations

---

### 11.3 Merge Organizations
**Test ID:** SUPERADMIN-049  
**Role:** super_admin  
**Steps:**
1. Select two organizations to merge
2. Specify target organization
3. Perform merge
4. Verify all users moved
5. Verify all data consolidated
6. Verify source organization archived/deleted

**Expected Result:** Super admin can merge organizations (if feature exists)

---

## 12. Platform Maintenance Tests

### 12.1 Database Maintenance Access
**Test ID:** SUPERADMIN-050  
**Role:** super_admin  
**Steps:**
1. Access database maintenance tools
2. View database stats:
   - Size
   - Table counts
   - Index status
3. Perform maintenance:
   - Run migrations
   - Optimize tables
   - Backup database

**Expected Result:** Super admin can perform database maintenance

---

### 12.2 Clear Cache
**Test ID:** SUPERADMIN-051  
**Role:** super_admin  
**Steps:**
1. Access cache management
2. Clear cache:
   - Application cache
   - Session cache
   - Query cache
3. Verify cache cleared
4. Verify system continues to function

**Expected Result:** Super admin can clear system cache

---

### 12.3 System Health Check
**Test ID:** SUPERADMIN-052  
**Role:** super_admin  
**Steps:**
1. Run system health check
2. Verify checks:
   - Database connectivity
   - External services
   - Storage availability
   - API endpoints
3. View health report
4. Verify issues flagged

**Expected Result:** Super admin can monitor system health

---

## 13. Emergency Functions

### 13.1 Emergency User Access
**Test ID:** SUPERADMIN-053  
**Role:** super_admin  
**Steps:**
1. User locked out of account
2. Super admin resets password
3. Or super admin grants temporary access
4. Verify user can access account

**Expected Result:** Super admin can restore user access in emergencies

---

### 13.2 Emergency Organization Access
**Test ID:** SUPERADMIN-054  
**Role:** super_admin  
**Steps:**
1. Organization locked out (all admins unavailable)
2. Super admin switches context to organization
3. Super admin performs necessary actions
4. Super admin creates new org admin

**Expected Result:** Super admin can recover organization access

---

### 13.3 Data Recovery
**Test ID:** SUPERADMIN-055  
**Role:** super_admin  
**Steps:**
1. Simulate data loss scenario
2. Super admin initiates data recovery
3. Restore from backup
4. Verify data restored correctly
5. Verify system functional

**Expected Result:** Super admin can recover data

---

## 14. Navigation and UI Tests

### 14.1 Super Admin Navigation
**Test ID:** SUPERADMIN-056  
**Role:** super_admin  
**Steps:**
1. Test navigation elements
2. Verify sections available:
   - Super Admin Dashboard
   - Organizations
   - Platform Users
   - System Settings
   - Reports/Analytics
3. Verify can navigate to all areas

**Expected Result:** Complete navigation for super admin functions

---

### 14.2 Context Indicator
**Test ID:** SUPERADMIN-057  
**Role:** super_admin  
**Steps:**
1. Switch between contexts:
   - Super admin view
   - Organization A context
   - Organization B context
2. Verify context always clearly indicated
3. Verify easy to determine current view

**Expected Result:** Clear context indicators prevent confusion

---

### 14.3 Quick Actions
**Test ID:** SUPERADMIN-058  
**Role:** super_admin  
**Steps:**
1. View quick actions panel
2. Verify shortcuts to common tasks:
   - Create organization
   - Create super admin
   - View recent activity
   - Access logs
3. Test quick actions work

**Expected Result:** Quick actions provide efficient access

---

## Test Execution Notes

### Prerequisites
- Test super_admin account
- Multiple test organizations
- Test users across all roles
- Test data in various states
- Platform in testable state

### Security Considerations
- Super admin credentials must be highly secure
- All super admin actions must be logged
- Access to super admin features must be strictly controlled
- No bypass of security measures even for super admin

### Critical Success Criteria
- ✅ Super admin can create and manage all organizations
- ✅ Super admin can assign and manage org admins
- ✅ Super admin can switch organization context
- ✅ Super admin can view and manage all platform data
- ✅ Super admin can access all lower-level role functions
- ✅ Super admin can perform platform maintenance
- ✅ Super admin actions are logged and auditable
- ✅ Platform protected from super admin mistakes (confirmations, warnings)
- ✅ Context switching works correctly
- ✅ All UI clearly indicates super admin status

