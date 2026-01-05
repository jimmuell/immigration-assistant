# Staff Role Testing Plan

## Overview
This test plan covers functionality available to users with the `staff` role. Staff members are paralegals, secretaries, or other support personnel who assist attorneys and administrators. They have access to admin features and attorney features but with potentially limited permissions compared to org_admin.

## Test Environment Setup
- Test staff user: `staff@test.com`
- Test organization with users, attorneys, clients
- Sample screenings and flows
- Test data for all staff functions

---

## 1. Staff Dashboard Access Tests

### 1.1 Dashboard Access
**Test ID:** STAFF-001  
**Role:** staff  
**Steps:**
1. Log in as staff
2. Verify redirect to `/admin` dashboard
3. Verify dashboard displays (same as org_admin view)
4. Verify appropriate welcome message

**Expected Result:** Staff user accesses admin dashboard successfully

---

### 1.2 Dashboard Stats Display
**Test ID:** STAFF-002  
**Role:** staff  
**Steps:**
1. View dashboard stats:
   - Total Users
   - Active Clients
   - Conversations
   - Completed Screenings
   - Attorneys
   - Administrators
2. Verify stats display correctly
3. Verify data from staff's organization only

**Expected Result:** Dashboard provides organizational overview to staff

---

## 2. User Management Tests

### 2.1 View Users List
**Test ID:** STAFF-003  
**Role:** staff  
**Steps:**
1. Navigate to `/admin/users`
2. Verify users list accessible
3. Verify can view all organization users
4. Verify user details visible

**Expected Result:** Staff can view user list

---

### 2.2 Limited User Editing
**Test ID:** STAFF-004  
**Role:** staff  
**Steps:**
1. Attempt to edit user details
2. Verify editing capabilities (may be limited vs org_admin)
3. If restrictions exist, verify appropriate message

**Expected Result:** Staff editing permissions configured correctly per business rules

---

### 2.3 Cannot Delete Users
**Test ID:** STAFF-005  
**Role:** staff  
**Steps:**
1. View user in list
2. Check for delete option
3. Verify delete not available or restricted
4. Verify only org_admin can delete users

**Expected Result:** Staff cannot delete users (if business rule applies)

---

## 3. Team Management Tests

### 3.1 View Team Members
**Test ID:** STAFF-006  
**Role:** staff  
**Steps:**
1. Navigate to team management page
2. Verify can view team members list
3. Verify see attorneys, staff, and admins

**Expected Result:** Staff can view team roster

---

### 3.2 Limited Team Invitation
**Test ID:** STAFF-007  
**Role:** staff  
**Steps:**
1. Check for "Invite Team Member" option
2. Verify staff cannot invite (or has limited invite capability)
3. Verify appropriate UI reflects permission level

**Expected Result:** Team invitation limited to org_admin (or per business rules)

---

### 3.3 Cannot Remove Team Members
**Test ID:** STAFF-008  
**Role:** staff  
**Steps:**
1. View team member
2. Check for removal option
3. Verify removal not available to staff
4. Verify only org_admin can remove team members

**Expected Result:** Staff cannot remove team members

---

## 4. Screening Management Tests

### 4.1 View All Screenings
**Test ID:** STAFF-009  
**Role:** staff  
**Steps:**
1. Navigate to `/admin/intakes`
2. Verify can view all organization screenings
3. Verify full list access

**Expected Result:** Staff has visibility into all screenings

---

### 4.2 Assign Screenings to Attorneys
**Test ID:** STAFF-010  
**Role:** staff  
**Steps:**
1. Select unassigned screening
2. Click "Assign"
3. Select attorney
4. Confirm assignment
5. Verify screening assigned successfully
6. Verify attorney notified

**Expected Result:** Staff can assign screenings to attorneys

---

### 4.3 Reassign Screenings
**Test ID:** STAFF-011  
**Role:** staff  
**Steps:**
1. Select assigned screening
2. Reassign to different attorney
3. Verify reassignment successful

**Expected Result:** Staff can reassign screenings between attorneys

---

### 4.4 View Screening Details
**Test ID:** STAFF-012  
**Role:** staff  
**Steps:**
1. Click to view screening details
2. Verify can access:
   - Client responses
   - Messages
   - Documents
   - Quotes
3. Verify full read access to screening data

**Expected Result:** Staff has full visibility into screening details

---

### 4.5 Update Screening Status
**Test ID:** STAFF-013  
**Role:** staff  
**Steps:**
1. Open screening
2. Change status
3. Verify status updated
4. Verify client and attorney see update

**Expected Result:** Staff can update screening statuses

---

### 4.6 Filter and Search Screenings
**Test ID:** STAFF-014  
**Role:** staff  
**Steps:**
1. Use screening filters:
   - By status
   - By attorney
   - By date
2. Use search functionality
3. Verify filtering and search work

**Expected Result:** Staff can efficiently find screenings

---

## 5. Attorney Functionality Access Tests

### 5.1 Access Attorney Dashboard
**Test ID:** STAFF-015  
**Role:** staff  
**Steps:**
1. Navigate to `/attorney`
2. Verify access granted
3. Verify attorney dashboard displays

**Expected Result:** Staff can access attorney dashboard

---

### 5.2 View Assigned Screenings (as Attorney)
**Test ID:** STAFF-016  
**Role:** staff  
**Steps:**
1. Have screenings assigned to staff member
2. View in attorney dashboard
3. Verify assigned screenings display

**Expected Result:** Staff can be assigned screenings like an attorney

---

### 5.3 Perform Attorney Functions
**Test ID:** STAFF-017  
**Role:** staff  
**Steps:**
1. Open assigned screening
2. Perform attorney tasks:
   - Update status
   - Send messages to client
   - Upload documents
   - Submit quotes (if permitted)
3. Verify all functions work

**Expected Result:** Staff can perform attorney functions on assigned cases

---

### 5.4 Communication with Clients
**Test ID:** STAFF-018  
**Role:** staff  
**Steps:**
1. Open screening assigned to staff
2. Navigate to Messages tab
3. Send message to client
4. Verify message delivered
5. Verify client can respond

**Expected Result:** Staff can communicate with clients

---

### 5.5 Document Management
**Test ID:** STAFF-019  
**Role:** staff  
**Steps:**
1. Navigate to Documents tab
2. Upload document to screening
3. Download client documents
4. Verify document operations work

**Expected Result:** Staff can manage screening documents

---

## 6. Flow Management Tests

### 6.1 View Flows
**Test ID:** STAFF-020  
**Role:** staff  
**Steps:**
1. Navigate to `/admin/flows`
2. Verify can view flows list
3. Verify can see all organization flows

**Expected Result:** Staff can view flows

---

### 6.2 Cannot Create Flows
**Test ID:** STAFF-021  
**Role:** staff  
**Steps:**
1. Check for "Create Flow" button
2. Verify create not available or restricted
3. If available, verify limited to org_admin

**Expected Result:** Flow creation limited to org_admin

---

### 6.3 Cannot Edit Flows
**Test ID:** STAFF-022  
**Role:** staff  
**Steps:**
1. Attempt to edit flow
2. Verify edit not available or restricted
3. Verify flow editor not accessible

**Expected Result:** Flow editing limited to org_admin

---

### 6.4 Cannot Activate/Deactivate Flows
**Test ID:** STAFF-023  
**Role:** staff  
**Steps:**
1. View active flow
2. Verify cannot toggle active status
3. Verify only org_admin can activate/deactivate

**Expected Result:** Flow activation limited to org_admin

---

### 6.5 Read-Only Flow Access
**Test ID:** STAFF-024  
**Role:** staff  
**Steps:**
1. View flow details
2. Verify can see flow structure
3. Verify cannot modify
4. Verify read-only access

**Expected Result:** Staff has read-only access to flows

---

## 7. Quote Management Tests

### 7.1 View Quotes
**Test ID:** STAFF-025  
**Role:** staff  
**Steps:**
1. View screening with quotes
2. Navigate to Quotes tab
3. Verify can view quote details

**Expected Result:** Staff can view quotes

---

### 7.2 Create Quotes (Permission Check)
**Test ID:** STAFF-026  
**Role:** staff  
**Steps:**
1. Check if staff can create quotes
2. If permitted, create and submit quote
3. If not permitted, verify appropriate restriction

**Expected Result:** Quote creation permissions follow business rules

---

### 7.3 Edit Quotes (Permission Check)
**Test ID:** STAFF-027  
**Role:** staff  
**Steps:**
1. View pending quote
2. Check if staff can edit
3. Verify permission level appropriate

**Expected Result:** Quote editing permissions follow business rules

---

## 8. Attorney Management Tests

### 8.1 View Attorneys List
**Test ID:** STAFF-028  
**Role:** staff  
**Steps:**
1. Navigate to attorneys section
2. Verify can view all firm attorneys
3. Verify attorney details visible

**Expected Result:** Staff can view attorney roster

---

### 8.2 Cannot Edit Attorney Profiles
**Test ID:** STAFF-029  
**Role:** staff  
**Steps:**
1. View attorney profile
2. Check for edit option
3. Verify editing not available or restricted
4. Verify only org_admin or attorney can edit

**Expected Result:** Attorney profile editing limited

---

### 8.3 Cannot Onboard New Attorneys
**Test ID:** STAFF-030  
**Role:** staff  
**Steps:**
1. Check for attorney onboarding option
2. Verify not available to staff
3. Verify restricted to org_admin

**Expected Result:** Attorney onboarding limited to org_admin

---

## 9. Client Interaction Tests

### 9.1 View Client List
**Test ID:** STAFF-031  
**Role:** staff  
**Steps:**
1. View users list filtered to clients
2. Verify all organization clients visible
3. Verify client details accessible

**Expected Result:** Staff can view all clients

---

### 9.2 View Client Screenings
**Test ID:** STAFF-032  
**Role:** staff  
**Steps:**
1. Select a client
2. View client's screenings
3. Verify can see all screenings for that client

**Expected Result:** Staff can view client screening history

---

### 9.3 Communicate on Behalf of Attorney
**Test ID:** STAFF-033  
**Role:** staff  
**Steps:**
1. Open screening assigned to attorney (not staff member)
2. Check if staff can send messages
3. If permitted, send message
4. Verify message attributed correctly

**Expected Result:** Staff message permissions follow business rules

---

## 10. Reporting and Analytics Tests

### 10.1 View Reports
**Test ID:** STAFF-034  
**Role:** staff  
**Steps:**
1. Access reports/analytics section
2. Verify can view organizational metrics
3. Verify data accessible

**Expected Result:** Staff can view reports

---

### 10.2 Cannot Export Reports (Permission Check)
**Test ID:** STAFF-035  
**Role:** staff  
**Steps:**
1. Attempt to export report
2. Verify export permissions
3. Confirm follows business rules

**Expected Result:** Report export permissions appropriate for staff role

---

## 11. Data Isolation Tests

### 11.1 Organization Data Isolation
**Test ID:** STAFF-036  
**Role:** staff  
**Steps:**
1. Log in as staff in Organization A
2. Verify only see data from Organization A
3. Verify cannot access Organization B data

**Expected Result:** Staff can only access their organization's data

---

### 11.2 Cannot Access Super Admin Functions
**Test ID:** STAFF-037  
**Role:** staff  
**Steps:**
1. Attempt to access `/super-admin`
2. Verify access denied
3. Verify redirect to appropriate page

**Expected Result:** Super admin functions not accessible to staff

---

### 11.3 Cannot Access Other Organizations
**Test ID:** STAFF-038  
**Role:** staff  
**Steps:**
1. Attempt to view/modify data from other organizations
2. Verify access completely blocked
3. Verify proper data isolation

**Expected Result:** Staff completely isolated to their organization

---

## 12. Permission Boundary Tests

### 12.1 Administrative Functions Inventory
**Test ID:** STAFF-039  
**Role:** staff  
**Steps:**
1. Document all admin functions staff CAN perform:
   - View users
   - Assign screenings
   - Update screening statuses
   - View flows
   - View attorneys
   - Access attorney functions
2. Document functions staff CANNOT perform:
   - Create/edit flows
   - Delete users
   - Onboard attorneys
   - Change organization settings
   - Access super admin features

**Expected Result:** Clear documentation of staff permissions

---

### 12.2 Attempt Restricted Actions
**Test ID:** STAFF-040  
**Role:** staff  
**Steps:**
1. Attempt each restricted action
2. Verify appropriate denial or restriction
3. Verify user-friendly error messages
4. Verify no security vulnerabilities

**Expected Result:** All restrictions properly enforced

---

## 13. Navigation and UI Tests

### 13.1 Admin Navigation
**Test ID:** STAFF-041  
**Role:** staff  
**Steps:**
1. Test all navigation elements
2. Verify appropriate sections available
3. Verify restricted sections hidden or disabled

**Expected Result:** Navigation reflects staff permission level

---

### 13.2 Mobile Navigation
**Test ID:** STAFF-042  
**Role:** staff  
**Steps:**
1. Access system on mobile device
2. Test mobile navigation
3. Verify all staff functions accessible on mobile

**Expected Result:** Mobile interface works for staff role

---

### 13.3 Sidebar Menu
**Test ID:** STAFF-043  
**Role:** staff  
**Steps:**
1. View sidebar menu items
2. Verify appropriate sections shown:
   - Dashboard
   - Users
   - Screenings
   - Attorneys
   - Attorney Dashboard link
3. Verify restricted sections not shown:
   - Flow Editor
   - Organization Settings (if restricted)

**Expected Result:** Menu reflects staff access level

---

## 14. Role Comparison Tests

### 14.1 Staff vs Org Admin Comparison
**Test ID:** STAFF-044  
**Role:** staff and org_admin  
**Steps:**
1. Log in as staff, document available functions
2. Log in as org_admin, document available functions
3. Compare and verify expected differences:
   - Org admin can create/edit flows
   - Org admin can onboard attorneys
   - Org admin can delete users
   - Org admin can change organization settings
4. Verify staff has more limited permissions

**Expected Result:** Clear permission differentiation between staff and org_admin

---

### 14.2 Staff vs Attorney Comparison
**Test ID:** STAFF-045  
**Role:** staff and attorney  
**Steps:**
1. Compare staff and attorney dashboards
2. Verify staff has:
   - Admin dashboard access
   - Broader organizational view
   - Screening assignment capabilities
3. Verify attorney has:
   - Focus on own cases only
   - No admin features (unless org_admin)

**Expected Result:** Staff has broader administrative access than regular attorney

---

## 15. Workflow Tests

### 15.1 Complete Screening Assignment Workflow
**Test ID:** STAFF-046  
**Role:** staff  
**Steps:**
1. New screening submitted by client
2. Staff reviews screening in admin panel
3. Staff assigns screening to appropriate attorney
4. Verify attorney receives notification
5. Verify screening appears in attorney's dashboard
6. Monitor progress through workflow

**Expected Result:** Staff can successfully manage screening assignment workflow

---

### 15.2 Support Attorney Workflow
**Test ID:** STAFF-047  
**Role:** staff  
**Steps:**
1. Attorney working on case requests support
2. Staff accesses same screening
3. Staff uploads additional documents
4. Staff communicates with client on behalf of attorney
5. Staff updates status
6. Verify all actions logged appropriately

**Expected Result:** Staff can effectively support attorney casework

---

## Test Execution Notes

### Prerequisites
- Test staff account in test organization
- Test org_admin account for comparison
- Test attorney account for comparison
- Sample screenings in various states
- Test clients and data

### Business Rules Clarification Needed
Some tests depend on specific business rules:
- Can staff create quotes or only attorneys?
- Can staff delete screenings?
- Can staff communicate with clients directly or only on assigned cases?
- Can staff export reports?
- Can staff view sensitive information like financial details?

### Critical Success Criteria
- ✅ Staff can access admin dashboard
- ✅ Staff can view all organizational data
- ✅ Staff can assign and manage screenings
- ✅ Staff can access attorney functionality
- ✅ Staff has appropriate restrictions vs org_admin
- ✅ Staff cannot access super admin functions
- ✅ Staff cannot modify flows
- ✅ Staff cannot delete users or attorneys
- ✅ Data properly isolated by organization
- ✅ All permissions enforced consistently

