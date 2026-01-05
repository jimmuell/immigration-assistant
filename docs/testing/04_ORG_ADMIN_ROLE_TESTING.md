# Organization Admin (org_admin) Role Testing Plan

## Overview
This test plan covers all functionality available to users with the `org_admin` role. Org admins have full administrative access to manage their organization including users, attorneys, flows, screenings, and team members. They also have access to all attorney functionality.

## Test Environment Setup
- Test org_admin user: `orgadmin@test.com`
- Test organization with users, attorneys, clients, and staff
- Sample flows and screenings
- Test team members for management testing

---

## 1. Admin Dashboard Tests

### 1.1 Dashboard Access and Display
**Test ID:** ORGADMIN-001  
**Role:** org_admin  
**Steps:**
1. Log in as org_admin
2. Navigate to `/admin` (or verify auto-redirect)
3. Verify dashboard elements:
   - Welcome message
   - Stats cards (Total Users, Active Clients, Conversations, Completed Screenings)
   - Secondary stats (Attorneys, Total Messages, Administrators)
   - Quick Actions section
   - Recent Users table
4. Verify all stats display correct counts

**Expected Result:** Admin dashboard displays with comprehensive organization overview

---

### 1.2 Stats Accuracy Verification
**Test ID:** ORGADMIN-002  
**Role:** org_admin  
**Steps:**
1. Query database for actual counts:
   - Total users in organization
   - Clients count
   - Attorneys count
   - Screenings count
   - Messages count
2. Compare with dashboard stats
3. Verify all counts match

**Expected Result:** Dashboard statistics accurately reflect database state

---

### 1.3 Recent Users Table
**Test ID:** ORGADMIN-003  
**Role:** org_admin  
**Steps:**
1. View "Recent Users" table on dashboard
2. Verify displays:
   - User avatar/initial
   - Name
   - Email
   - Role (with color coding)
   - Join date
3. Verify shows 5 most recent users
4. Verify "View All" button navigates to full users list

**Expected Result:** Recent users table displays correctly with proper formatting

---

### 1.4 Quick Action Cards
**Test ID:** ORGADMIN-004  
**Role:** org_admin  
**Steps:**
1. Verify quick action cards present:
   - User Management
   - Flows
   - Screenings
   - Team Management
   - Attorney Dashboard link
2. Click each card's action button
3. Verify navigation to correct page

**Expected Result:** Quick actions provide efficient navigation to key features

---

## 2. User Management Tests

### 2.1 View Users List
**Test ID:** ORGADMIN-005  
**Role:** org_admin  
**Steps:**
1. Navigate to `/admin/users`
2. Verify users list displays
3. Verify shows users from organization only
4. Verify each user shows:
   - Name
   - Email
   - Role
   - Join date
   - Actions

**Expected Result:** Users list displays all organization users

---

### 2.2 Filter Users by Role
**Test ID:** ORGADMIN-006  
**Role:** org_admin  
**Steps:**
1. On users page, use role filter
2. Filter by each role type:
   - client
   - attorney
   - staff
   - org_admin
3. Verify only users with selected role display

**Expected Result:** Role filter works correctly

---

### 2.3 Search Users
**Test ID:** ORGADMIN-007  
**Role:** org_admin  
**Steps:**
1. Use search field to search by:
   - Name
   - Email
2. Verify search results match query
3. Verify search is case-insensitive

**Expected Result:** User search functionality works correctly

---

### 2.4 View User Details
**Test ID:** ORGADMIN-008  
**Role:** org_admin  
**Steps:**
1. Click to view individual user details
2. Verify displays:
   - All user information
   - User's screenings (if client)
   - User's activity
   - Edit options

**Expected Result:** Detailed user information accessible

---

### 2.5 Edit User Role
**Test ID:** ORGADMIN-009  
**Role:** org_admin  
**Steps:**
1. Select a user
2. Click edit
3. Change user role
4. Save changes
5. Verify role updated in database
6. Verify user's access changes accordingly

**Expected Result:** Org admin can change user roles

---

### 2.6 Delete User
**Test ID:** ORGADMIN-010  
**Role:** org_admin  
**Steps:**
1. Select a user
2. Click delete
3. Confirm deletion
4. Verify user removed from list
5. Verify user deleted from database (or marked inactive)
6. Verify related data handled correctly (screenings, messages, etc.)

**Expected Result:** Org admin can delete users with proper data handling

---

### 2.7 Cannot Edit Super Admin Users
**Test ID:** ORGADMIN-011  
**Role:** org_admin  
**Steps:**
1. View users list
2. Verify super_admin users not shown or not editable
3. Attempt to access super admin user details
4. Verify access restricted

**Expected Result:** Org admins cannot manage super admin accounts

---

## 3. Team Management Tests

### 3.1 View Team Members Page
**Test ID:** ORGADMIN-012  
**Role:** org_admin  
**Steps:**
1. Navigate to `/admin/users?tab=team` or `/admin/team`
2. Verify team members list displays
3. Verify shows attorneys, staff, and org_admins only
4. Verify clients excluded from this view

**Expected Result:** Team page shows organization staff and attorneys

---

### 3.2 Invite Team Member
**Test ID:** ORGADMIN-013  
**Role:** org_admin  
**Steps:**
1. Click "Invite Team Member" button
2. Fill in invitation form:
   - Email
   - Name
   - Role (attorney, staff, org_admin)
3. Submit invitation
4. Verify invitation sent
5. Verify temporary account created
6. Verify invitation email sent (if email configured)

**Expected Result:** Org admin can invite new team members

---

### 3.3 Assign Attorney Role
**Test ID:** ORGADMIN-014  
**Role:** org_admin  
**Steps:**
1. Invite new team member with attorney role
2. Verify attorney profile automatically created
3. Verify attorney appears in attorneys list

**Expected Result:** Attorney role assignment creates attorney profile

---

### 3.4 Assign Staff Role
**Test ID:** ORGADMIN-015  
**Role:** org_admin  
**Steps:**
1. Invite new team member with staff role
2. Verify staff user created
3. Verify staff has appropriate access level

**Expected Result:** Staff role assigned correctly with proper permissions

---

### 3.5 Reset Team Member Password
**Test ID:** ORGADMIN-016  
**Role:** org_admin  
**Steps:**
1. Select team member
2. Click "Reset Password"
3. Verify temporary password generated
4. Verify password updated in database
5. Verify team member can login with new password

**Expected Result:** Org admin can reset team member passwords

---

### 3.6 Remove Team Member
**Test ID:** ORGADMIN-017  
**Role:** org_admin  
**Steps:**
1. Select team member
2. Click "Remove"
3. Confirm removal
4. Verify user removed from team
5. Verify user deleted or deactivated
6. Verify related screenings reassigned or handled

**Expected Result:** Org admin can remove team members

---

### 3.7 View Team Member Activity
**Test ID:** ORGADMIN-018  
**Role:** org_admin  
**Steps:**
1. Click to view team member details
2. Verify shows:
   - Assigned screenings (for attorneys)
   - Activity log
   - Performance metrics (if available)

**Expected Result:** Team member activity visible to org admin

---

## 4. Attorney Management Tests

### 4.1 View Attorneys List
**Test ID:** ORGADMIN-019  
**Role:** org_admin  
**Steps:**
1. Navigate to `/admin/attorneys` or attorneys section
2. Verify all organization attorneys display
3. Verify each shows:
   - Name
   - Email
   - Specialties
   - Rating
   - Number of cases
   - Actions

**Expected Result:** All attorneys listed with professional information

---

### 4.2 View Attorney Details
**Test ID:** ORGADMIN-020  
**Role:** org_admin  
**Steps:**
1. Click to view attorney details
2. Navigate to `/admin/attorneys/[id]`
3. Verify displays:
   - Professional information
   - Assigned screenings
   - Performance stats
   - Ratings and reviews
   - Edit options

**Expected Result:** Complete attorney profile and activity visible

---

### 4.3 Edit Attorney Profile
**Test ID:** ORGADMIN-021  
**Role:** org_admin  
**Steps:**
1. On attorney details page, click edit
2. Update attorney information:
   - Bio
   - Specialties
   - Years of experience
   - Bar information
3. Save changes
4. Verify updates saved
5. Verify changes reflected in attorney's profile

**Expected Result:** Org admin can edit attorney profiles

---

### 4.4 Onboard New Attorney
**Test ID:** ORGADMIN-022  
**Role:** org_admin  
**Steps:**
1. Navigate to attorney onboarding
2. Enter attorney information
3. Submit onboarding
4. Verify attorney account created
5. Verify attorney profile created
6. Verify attorney added to organization

**Expected Result:** Org admin can onboard new attorneys to firm

---

### 4.5 Deactivate Attorney
**Test ID:** ORGADMIN-023  
**Role:** org_admin  
**Steps:**
1. Select attorney
2. Deactivate attorney account
3. Verify attorney cannot log in
4. Verify existing cases remain accessible to admin
5. Verify new cases not assignable to deactivated attorney

**Expected Result:** Org admin can deactivate attorneys

---

## 5. Screening Management Tests

### 5.1 View All Screenings
**Test ID:** ORGADMIN-024  
**Role:** org_admin  
**Steps:**
1. Navigate to `/admin/intakes`
2. Verify all organization screenings display
3. Verify can see screenings from all clients
4. Verify each shows:
   - Client name
   - Flow name
   - Status
   - Assigned attorney (if assigned)
   - Date submitted
   - Actions

**Expected Result:** Org admin can view all organization screenings

---

### 5.2 Filter Screenings
**Test ID:** ORGADMIN-025  
**Role:** org_admin  
**Steps:**
1. Apply filters:
   - By status
   - By assigned attorney
   - By flow type
   - By date range
2. Verify filtering works for each criteria

**Expected Result:** Screening filters work correctly

---

### 5.3 Search Screenings
**Test ID:** ORGADMIN-026  
**Role:** org_admin  
**Steps:**
1. Use search to find screenings by:
   - Client name
   - Submission ID
   - Flow name
2. Verify search results accurate

**Expected Result:** Screening search functionality works

---

### 5.4 Assign Screening to Attorney
**Test ID:** ORGADMIN-027  
**Role:** org_admin  
**Steps:**
1. Select unassigned screening
2. Click "Assign"
3. Select attorney from dropdown
4. Confirm assignment
5. Verify screening assigned
6. Verify attorney notified
7. Verify screening appears in attorney's dashboard

**Expected Result:** Org admin can assign screenings to attorneys

---

### 5.5 Reassign Screening
**Test ID:** ORGADMIN-028  
**Role:** org_admin  
**Steps:**
1. Select screening assigned to attorney A
2. Reassign to attorney B
3. Confirm reassignment
4. Verify assignment updated
5. Verify attorney A notified of removal
6. Verify attorney B notified of new assignment

**Expected Result:** Org admin can reassign screenings between attorneys

---

### 5.6 View Screening Details
**Test ID:** ORGADMIN-029  
**Role:** org_admin  
**Steps:**
1. Click to view any screening
2. Verify access to all screening information:
   - Client responses
   - Messages between client and attorney
   - Documents
   - Quotes
   - Status history
3. Verify full administrative view

**Expected Result:** Org admin has full visibility into all screenings

---

### 5.7 Update Screening Status
**Test ID:** ORGADMIN-030  
**Role:** org_admin  
**Steps:**
1. Open any screening
2. Change status
3. Verify status updated
4. Verify client and attorney see updated status

**Expected Result:** Org admin can update screening statuses

---

### 5.8 Delete Screening
**Test ID:** ORGADMIN-031  
**Role:** org_admin  
**Steps:**
1. Select screening
2. Delete screening
3. Confirm deletion
4. Verify screening removed
5. Verify related data handled (messages, documents, quotes)

**Expected Result:** Org admin can delete screenings (with caution)

---

## 6. Flow Management Tests

### 6.1 View Flows List
**Test ID:** ORGADMIN-032  
**Role:** org_admin  
**Steps:**
1. Navigate to `/admin/flows`
2. Verify all organization flows display
3. Verify each shows:
   - Flow name
   - Description
   - Active status
   - Created date
   - Number of submissions
   - Actions

**Expected Result:** All flows listed with complete information

---

### 6.2 Create New Flow
**Test ID:** ORGADMIN-033  
**Role:** org_admin  
**Steps:**
1. Click "Create New Flow"
2. Enter flow details:
   - Name
   - Description
3. Submit
4. Verify flow created
5. Verify flow appears in list (inactive)

**Expected Result:** Org admin can create new flows

---

### 6.3 Edit Flow Metadata
**Test ID:** ORGADMIN-034  
**Role:** org_admin  
**Steps:**
1. Select flow
2. Click edit
3. Update name or description
4. Save changes
5. Verify updates saved
6. Verify changes reflected in flow list and client view

**Expected Result:** Org admin can edit flow information

---

### 6.4 Activate Flow
**Test ID:** ORGADMIN-035  
**Role:** org_admin  
**Steps:**
1. Select inactive flow
2. Toggle "Active" status
3. Verify flow activated
4. Verify flow appears on client dashboard
5. Verify clients can start flow

**Expected Result:** Org admin can activate flows for client use

---

### 6.5 Deactivate Flow
**Test ID:** ORGADMIN-036  
**Role:** org_admin  
**Steps:**
1. Select active flow
2. Toggle "Active" status to off
3. Verify flow deactivated
4. Verify flow removed from client dashboard
5. Verify in-progress screenings still accessible

**Expected Result:** Org admin can deactivate flows

---

### 6.6 Delete Flow
**Test ID:** ORGADMIN-037  
**Role:** org_admin  
**Steps:**
1. Select flow with no submissions
2. Delete flow
3. Confirm deletion
4. Verify flow deleted from database

**Expected Result:** Org admin can delete flows (with restrictions for flows with data)

---

### 6.7 Cannot Delete Flow with Submissions
**Test ID:** ORGADMIN-038  
**Role:** org_admin  
**Steps:**
1. Attempt to delete flow with existing submissions
2. Verify warning message
3. Verify deletion blocked or requires confirmation
4. Verify data integrity maintained

**Expected Result:** System protects against deleting flows with existing data

---

### 6.8 Duplicate Flow
**Test ID:** ORGADMIN-039  
**Role:** org_admin  
**Steps:**
1. Select existing flow
2. Click "Duplicate"
3. Verify copy created with new name
4. Verify copy is inactive by default
5. Verify all flow structure copied

**Expected Result:** Org admin can duplicate flows for easy creation

---

## 7. Flow Editor Tests

### 7.1 Access Flow Editor
**Test ID:** ORGADMIN-040  
**Role:** org_admin  
**Steps:**
1. Select flow
2. Click "Edit Flow" or "Flow Editor"
3. Navigate to `/admin/flows-editor/[id]`
4. Verify flow editor interface loads

**Expected Result:** Flow editor accessible for org admin

---

### 7.2 Add Start Node
**Test ID:** ORGADMIN-041  
**Role:** org_admin  
**Steps:**
1. In flow editor, verify start node exists or add one
2. Verify start node configurable
3. Verify only one start node allowed

**Expected Result:** Start node functions correctly

---

### 7.3 Add Question Nodes
**Test ID:** ORGADMIN-042  
**Role:** org_admin  
**Steps:**
1. Add different question types:
   - Yes/No question
   - Multiple choice
   - Text input
   - Date input
2. Configure each node:
   - Question text
   - Options (for multiple choice)
   - Validation rules
   - Help text
3. Verify nodes save correctly

**Expected Result:** All question node types can be added and configured

---

### 7.4 Add Conditional Logic
**Test ID:** ORGADMIN-043  
**Role:** org_admin  
**Steps:**
1. Add yes/no question node
2. Add multiple next nodes
3. Create conditional edges:
   - "Yes" path to node A
   - "No" path to node B
4. Verify conditions save correctly

**Expected Result:** Conditional branching works in flow editor

---

### 7.5 Add Form Node (Multiple Fields)
**Test ID:** ORGADMIN-044  
**Role:** org_admin  
**Steps:**
1. Add form node
2. Configure multiple fields in form:
   - First name
   - Last name
   - Date of birth
   - Address
3. Set validation for each field
4. Save form node

**Expected Result:** Multi-field form nodes can be created

---

### 7.6 Add Info/Display Node
**Test ID:** ORGADMIN-045  
**Role:** org_admin  
**Steps:**
1. Add info node
2. Enter information text
3. Configure display options
4. Save node

**Expected Result:** Information display nodes work correctly

---

### 7.7 Add End/Completion Node
**Test ID:** ORGADMIN-046  
**Role:** org_admin  
**Steps:**
1. Add completion node
2. Configure completion message
3. Connect final step to completion
4. Verify flow can have multiple end points (if applicable)

**Expected Result:** Completion nodes properly end flow

---

### 7.8 Connect Nodes with Edges
**Test ID:** ORGADMIN-047  
**Role:** org_admin  
**Steps:**
1. Create multiple nodes
2. Drag connections between nodes
3. Verify edges created
4. Verify connection direction correct
5. Delete edge
6. Verify edge removed

**Expected Result:** Node connections work correctly

---

### 7.9 Rearrange Nodes
**Test ID:** ORGADMIN-048  
**Role:** org_admin  
**Steps:**
1. Drag nodes to new positions
2. Verify position updates
3. Verify connections maintained
4. Save flow
5. Reload editor
6. Verify positions saved

**Expected Result:** Node positions can be arranged and saved

---

### 7.10 Delete Nodes
**Test ID:** ORGADMIN-049  
**Role:** org_admin  
**Steps:**
1. Select node
2. Delete node
3. Verify node removed
4. Verify connected edges removed
5. Verify flow structure updated

**Expected Result:** Nodes can be deleted with proper cleanup

---

### 7.11 Validate Flow Structure
**Test ID:** ORGADMIN-050  
**Role:** org_admin  
**Steps:**
1. Attempt to save flow with errors:
   - No start node
   - Disconnected nodes
   - Missing end node
2. Verify validation errors display
3. Verify cannot activate invalid flow

**Expected Result:** Flow validation prevents invalid configurations

---

### 7.12 Preview Flow
**Test ID:** ORGADMIN-051  
**Role:** org_admin  
**Steps:**
1. In flow editor, click "Preview"
2. Verify preview modal opens
3. Test flow as client would see it
4. Answer questions
5. Verify flow logic works
6. Close preview without saving data

**Expected Result:** Flow preview allows testing before activation

---

### 7.13 Save Flow Changes
**Test ID:** ORGADMIN-052  
**Role:** org_admin  
**Steps:**
1. Make changes to flow
2. Click "Save"
3. Verify changes saved to database
4. Reload editor
5. Verify changes persisted

**Expected Result:** Flow changes save correctly

---

### 7.14 Discard Unsaved Changes
**Test ID:** ORGADMIN-053  
**Role:** org_admin  
**Steps:**
1. Make changes to flow
2. Attempt to leave editor
3. Verify warning about unsaved changes
4. Choose to discard
5. Verify changes not saved

**Expected Result:** Unsaved changes protection works

---

## 8. Attorney Dashboard Access Tests

### 8.1 Access Attorney Dashboard
**Test ID:** ORGADMIN-054  
**Role:** org_admin  
**Steps:**
1. Navigate to `/attorney`
2. Verify access granted
3. Verify attorney dashboard displays
4. Verify org admin can perform all attorney functions

**Expected Result:** Org admin has full access to attorney functionality

---

### 8.2 Org Admin as Attorney
**Test ID:** ORGADMIN-055  
**Role:** org_admin  
**Steps:**
1. Have screenings assigned to org admin
2. View screenings in attorney dashboard
3. Perform attorney functions:
   - Update status
   - Send messages
   - Submit quotes
   - Upload documents
4. Verify all attorney functions work

**Expected Result:** Org admin can act as attorney for cases

---

## 9. Organization Settings Tests (if applicable)

### 9.1 View Organization Settings
**Test ID:** ORGADMIN-056  
**Role:** org_admin  
**Steps:**
1. Navigate to organization settings
2. Verify displays:
   - Organization name
   - Contact information
   - Website
   - Domain settings

**Expected Result:** Organization settings accessible

---

### 9.2 Update Organization Information
**Test ID:** ORGADMIN-057  
**Role:** org_admin  
**Steps:**
1. Edit organization settings:
   - Display name
   - Contact email
   - Phone number
   - Address
2. Save changes
3. Verify updates saved
4. Verify changes reflected across system

**Expected Result:** Org admin can update organization details

---

### 9.3 Cannot Change Organization Type
**Test ID:** ORGADMIN-058  
**Role:** org_admin  
**Steps:**
1. View organization settings
2. Verify organization type field read-only or not editable
3. Verify only super admin can change type

**Expected Result:** Org type changes restricted to super admin

---

## 10. Reports and Analytics Tests (if applicable)

### 10.1 View Analytics Dashboard
**Test ID:** ORGADMIN-059  
**Role:** org_admin  
**Steps:**
1. Access analytics/reports section
2. Verify displays metrics:
   - Screening volume over time
   - Attorney performance
   - Client acquisition
   - Conversion rates
3. Verify data accurate

**Expected Result:** Analytics provide insights into organization performance

---

### 10.2 Export Reports
**Test ID:** ORGADMIN-060  
**Role:** org_admin  
**Steps:**
1. Generate report
2. Export to CSV/PDF
3. Verify export contains correct data
4. Verify file downloads successfully

**Expected Result:** Reports can be exported for external use

---

## 11. Data Isolation Tests

### 11.1 Cannot Access Other Organizations
**Test ID:** ORGADMIN-061  
**Role:** org_admin  
**Steps:**
1. Log in as org admin in Organization A
2. Attempt to access data from Organization B:
   - Users
   - Screenings
   - Flows
3. Verify all data isolated to Organization A only

**Expected Result:** Org admin can only manage their own organization

---

### 11.2 Cannot See Super Admin Functions
**Test ID:** ORGADMIN-062  
**Role:** org_admin  
**Steps:**
1. Attempt to access super admin routes
2. Verify redirect or access denied
3. Verify cannot see:
   - Other organizations
   - Platform-wide settings
   - Super admin controls

**Expected Result:** Super admin functions not accessible to org admin

---

## Test Execution Notes

### Prerequisites
- Test org_admin account with full permissions
- Test organization with diverse data
- Sample users in each role
- Sample flows and screenings
- Test attorney and staff accounts

### Critical Success Criteria
- ✅ Org admin can manage all users in organization
- ✅ Org admin can manage team members
- ✅ Org admin can create and edit flows
- ✅ Org admin can assign screenings to attorneys
- ✅ Org admin can view all organization data
- ✅ Org admin has access to attorney functionality
- ✅ Org admin cannot access other organizations
- ✅ Org admin cannot access super admin features
- ✅ All administrative functions work correctly
- ✅ Data properly isolated by organization

