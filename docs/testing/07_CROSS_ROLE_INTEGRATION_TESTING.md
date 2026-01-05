# Cross-Role Integration Testing Plan

## Overview
This test plan covers integration scenarios that involve multiple user roles interacting with each other and the system. These tests ensure that the complete workflows function correctly across role boundaries.

## Test Environment Setup
- Test users for all roles (client, attorney, staff, org_admin, super_admin)
- Multiple test organizations
- Complete test data set
- All features configured and active

---

## 1. Client-Attorney Workflow Tests

### 1.1 Complete Client Intake to Attorney Assignment
**Test ID:** INTEGRATION-001  
**Roles:** client, org_admin, attorney  
**Steps:**
1. Client logs in and starts flow
2. Client completes screening and submits
3. Org_admin views new submission
4. Org_admin assigns screening to attorney
5. Attorney receives notification
6. Attorney views screening in dashboard
7. Verify screening data intact throughout

**Expected Result:** Complete workflow from client submission to attorney assignment works seamlessly

---

### 1.2 Attorney-Client Communication Flow
**Test ID:** INTEGRATION-002  
**Roles:** attorney, client  
**Steps:**
1. Attorney opens assigned screening
2. Attorney sends message to client with questions
3. Client logs in and sees new message notification
4. Client reads message and responds
5. Attorney receives client response
6. Back-and-forth conversation continues
7. Verify all messages delivered and attributed correctly

**Expected Result:** Bidirectional communication works correctly

---

### 1.3 Quote Request and Response Flow
**Test ID:** INTEGRATION-003  
**Roles:** attorney, client  
**Steps:**
1. Attorney reviews client screening
2. Attorney creates and submits quote
3. Screening status changes to "quoted"
4. Client logs in and sees quote notification
5. Client reviews quote details
6. Client accepts quote
7. Attorney receives acceptance notification
8. Screening status changes to "quote_accepted"
9. Verify both parties see updated status

**Expected Result:** Complete quote workflow functions correctly

---

### 1.4 Document Exchange Flow
**Test ID:** INTEGRATION-004  
**Roles:** client, attorney  
**Steps:**
1. Attorney requests documents via message
2. Client uploads documents
3. Attorney receives notification of new documents
4. Attorney views and downloads documents
5. Attorney uploads additional documents
6. Client sees attorney's documents
7. Verify both parties can access all documents

**Expected Result:** Document exchange works bidirectionally

---

### 1.5 Screening Status Changes Visible to All
**Test ID:** INTEGRATION-005  
**Roles:** client, attorney, org_admin, staff  
**Steps:**
1. Attorney changes screening status to "in_progress"
2. Client views screening - verify sees "in_progress"
3. Org_admin views screening - verify sees "in_progress"
4. Staff views screening - verify sees "in_progress"
5. Attorney changes to "awaiting_client"
6. All parties verify see updated status

**Expected Result:** Status changes immediately visible to all relevant users

---

## 2. Admin-Attorney Workflow Tests

### 2.1 Admin Assigns Screening to Attorney
**Test ID:** INTEGRATION-006  
**Roles:** org_admin, attorney  
**Steps:**
1. Client submits screening (appears as unassigned)
2. Org_admin views unassigned screenings
3. Org_admin selects attorney and assigns
4. Attorney dashboard immediately shows new assignment
5. Attorney receives notification
6. Verify assignment recorded in database

**Expected Result:** Assignment process works smoothly

---

### 2.2 Admin Reassigns Screening
**Test ID:** INTEGRATION-007  
**Roles:** org_admin, attorney (2)  
**Steps:**
1. Screening assigned to Attorney A
2. Attorney A begins work (sends message, updates status)
3. Org_admin reassigns to Attorney B
4. Attorney A no longer sees screening in dashboard
5. Attorney B sees screening with full history
6. Verify all previous work (messages, status) preserved
7. Client sees updated attorney assignment

**Expected Result:** Reassignment transfers case cleanly with history intact

---

### 2.3 Admin Creates Flow, Client Uses It
**Test ID:** INTEGRATION-008  
**Roles:** org_admin, client  
**Steps:**
1. Org_admin creates new flow
2. Org_admin designs flow with various question types
3. Org_admin activates flow
4. Client logs in
5. Client sees new flow on dashboard
6. Client starts and completes flow
7. Submission appears in admin dashboard
8. Verify all data captured correctly

**Expected Result:** Flow creation to client usage workflow functions end-to-end

---

### 2.4 Admin Monitors Attorney Performance
**Test ID:** INTEGRATION-009  
**Roles:** org_admin, attorney  
**Steps:**
1. Attorney handles multiple cases
2. Attorney submits quotes, communicates with clients
3. Org_admin views attorney performance metrics
4. Verify org_admin sees:
   - Number of assigned cases
   - Cases in progress
   - Quotes submitted
   - Client communications
   - Average response time
5. Verify data accurate

**Expected Result:** Admin has visibility into attorney activity

---

## 3. Staff-Involved Workflows

### 3.1 Staff Assigns Screening, Monitors Progress
**Test ID:** INTEGRATION-010  
**Roles:** staff, attorney, client  
**Steps:**
1. Client submits screening
2. Staff reviews and assigns to attorney
3. Staff monitors attorney progress
4. Staff sends supportive message to client
5. Attorney and staff both access same screening
6. Verify no conflicts or data issues

**Expected Result:** Staff can effectively support attorney casework

---

### 3.2 Staff Acts as Attorney
**Test ID:** INTEGRATION-011  
**Roles:** staff (as attorney), client  
**Steps:**
1. Screening assigned to staff member
2. Staff manages case as attorney would:
   - Updates status
   - Communicates with client
   - Uploads documents
   - Submits quote
3. Client interacts with staff
4. Org_admin monitors staff's work
5. Verify all functions work correctly

**Expected Result:** Staff can handle cases independently

---

### 3.3 Staff Supports Attorney on Case
**Test ID:** INTEGRATION-012  
**Roles:** staff, attorney, client  
**Steps:**
1. Case assigned to attorney
2. Staff assists by:
   - Uploading requested documents
   - Sending update messages to client
   - Updating status based on attorney's direction
3. Attorney completes substantive work
4. Verify collaboration works smoothly
5. Verify actions properly attributed

**Expected Result:** Staff and attorney can collaborate on cases

---

## 4. Multi-Organization Workflows

### 4.1 Super Admin Creates Org, Assigns Admin
**Test ID:** INTEGRATION-013  
**Roles:** super_admin, org_admin  
**Steps:**
1. Super admin creates new organization
2. Super admin creates org_admin user
3. Super admin assigns admin to organization
4. Org_admin logs in
5. Org_admin accesses admin dashboard
6. Org_admin can manage organization
7. Verify complete organization setup

**Expected Result:** New organization can be set up and administered

---

### 4.2 Super Admin Switches Context
**Test ID:** INTEGRATION-014  
**Roles:** super_admin, org_admin, attorney, client  
**Steps:**
1. Super admin switches to Organization A context
2. Super admin performs org_admin functions
3. Super admin creates flow, activates it
4. Organization A client uses flow
5. Super admin assigns resulting screening to attorney
6. Attorney in Organization A processes screening
7. Super admin switches to Organization B
8. Verify context switch clean
9. Verify no data bleeding between orgs

**Expected Result:** Context switching maintains proper data isolation

---

### 4.3 Attorney Onboarding Across Multiple Firms
**Test ID:** INTEGRATION-015  
**Roles:** public (attorney registrant), super_admin  
**Steps:**
1. Attorney A registers with Firm X domain
2. System matches to existing Firm X org
3. Attorney A assigned to Firm X
4. Attorney B registers with new Firm Y domain
5. System creates new Firm Y org
6. Attorney B assigned to Firm Y
7. Super admin views both organizations
8. Verify attorneys in correct organizations
9. Verify complete isolation between firms

**Expected Result:** Attorney onboarding correctly handles firm matching

---

## 5. Permission Boundary Tests

### 5.1 Client Cannot Access Attorney Screening Details
**Test ID:** INTEGRATION-016  
**Roles:** client, attorney  
**Steps:**
1. Client A submits screening
2. Note screening ID
3. Client B (different client) logs in
4. Client B attempts to access Client A's screening by URL
5. Verify access denied
6. Verify Client B only sees own screenings

**Expected Result:** Clients cannot access each other's data

---

### 5.2 Attorney Cannot Access Other Attorney's Cases
**Test ID:** INTEGRATION-017  
**Roles:** attorney (2)  
**Steps:**
1. Screening assigned to Attorney A
2. Attorney B logs in
3. Attorney B attempts to access Attorney A's screening
4. Verify access denied
5. Verify Attorney B only sees own assignments

**Expected Result:** Attorneys cannot access each other's cases

---

### 5.3 Org Admin Cannot Access Other Organization
**Test ID:** INTEGRATION-018  
**Roles:** org_admin (2 from different orgs)  
**Steps:**
1. Org Admin A in Organization 1 logs in
2. Org Admin B in Organization 2 logs in
3. Org Admin A attempts to access Organization 2 data
4. Verify access completely blocked
5. Verify no data leakage

**Expected Result:** Complete organization isolation for org admins

---

### 5.4 Role Escalation Prevention
**Test ID:** INTEGRATION-019  
**Roles:** client, attorney, org_admin  
**Steps:**
1. Client attempts to modify own role to org_admin
2. Verify API call blocked
3. Attorney attempts to assign screenings (admin function)
4. Verify blocked if not also org_admin/staff
5. Verify no privilege escalation possible

**Expected Result:** Role permissions strictly enforced

---

## 6. Concurrent User Tests

### 6.1 Multiple Users Edit Same Screening
**Test ID:** INTEGRATION-020  
**Roles:** attorney, staff, org_admin  
**Steps:**
1. Attorney opens screening
2. Staff opens same screening simultaneously
3. Attorney updates status to "in_progress"
4. Staff adds document
5. Org_admin views screening
6. Verify no data conflicts
7. Verify all changes preserved

**Expected Result:** Concurrent edits handled gracefully

---

### 6.2 Attorney and Client Message Simultaneously
**Test ID:** INTEGRATION-021  
**Roles:** attorney, client  
**Steps:**
1. Both open message interface for same screening
2. Both send messages at same time
3. Verify both messages delivered
4. Verify correct ordering
5. Verify no message loss

**Expected Result:** Concurrent messaging works correctly

---

### 6.3 Multiple Admins Assign Screenings
**Test ID:** INTEGRATION-022  
**Roles:** org_admin, staff  
**Steps:**
1. Multiple unassigned screenings exist
2. Org_admin and staff both assign screenings simultaneously
3. Verify no double-assignments
4. Verify all assignments successful
5. Verify database consistency

**Expected Result:** Concurrent administrative actions handled properly

---

## 7. Data Consistency Tests

### 7.1 Screening Data Consistency Across Views
**Test ID:** INTEGRATION-023  
**Roles:** client, attorney, org_admin  
**Steps:**
1. Client submits screening with specific answers
2. Attorney views screening
3. Org_admin views screening
4. Compare data across all three views
5. Verify complete consistency

**Expected Result:** All users see identical screening data

---

### 7.2 User Profile Changes Reflected Everywhere
**Test ID:** INTEGRATION-024  
**Roles:** attorney, client, org_admin  
**Steps:**
1. Attorney updates profile (name, bio)
2. Client views attorney profile
3. Org_admin views attorney in team list
4. Verify updated information visible to all

**Expected Result:** Profile changes immediately visible across system

---

### 7.3 Organization Settings Affect All Members
**Test ID:** INTEGRATION-025  
**Roles:** org_admin, attorney, client, staff  
**Steps:**
1. Org_admin changes organization settings (name, display)
2. All organization members log in
3. Verify all see updated organization information

**Expected Result:** Organization changes apply to all members

---

## 8. Notification and Alert Tests

### 8.1 Assignment Notifications
**Test ID:** INTEGRATION-026  
**Roles:** org_admin, attorney  
**Steps:**
1. Org_admin assigns screening to attorney
2. Verify attorney receives notification (if implemented)
3. Verify notification accurate and timely
4. Attorney acknowledges notification
5. Verify notification cleared

**Expected Result:** Assignment notifications work correctly

---

### 8.2 Message Notifications
**Test ID:** INTEGRATION-027  
**Roles:** attorney, client  
**Steps:**
1. Client sends message to attorney
2. Verify attorney receives notification
3. Attorney sends message to client
4. Verify client receives notification
5. Verify notifications accurate

**Expected Result:** Message notifications delivered to both parties

---

### 8.3 Quote Response Notifications
**Test ID:** INTEGRATION-028  
**Roles:** attorney, client  
**Steps:**
1. Attorney submits quote
2. Verify client receives notification
3. Client accepts quote
4. Verify attorney receives notification
5. Verify notifications prompt appropriate actions

**Expected Result:** Quote-related notifications work correctly

---

## 9. Search and Filter Integration

### 9.1 Admin Searches Across All Data
**Test ID:** INTEGRATION-029  
**Roles:** org_admin  
**Steps:**
1. Create test data: users, screenings, flows
2. Org_admin performs searches:
   - By client name → finds screenings
   - By attorney name → finds assignments
   - By flow name → finds submissions
3. Verify all searches return accurate results
4. Verify search spans all relevant data

**Expected Result:** Comprehensive search works across data types

---

### 9.2 Attorney Filters Own Screenings
**Test ID:** INTEGRATION-030  
**Roles:** attorney  
**Steps:**
1. Attorney has screenings in various states
2. Attorney filters by status
3. Attorney searches by client name
4. Verify filtering and search only show attorney's cases
5. Verify no access to others' cases through search

**Expected Result:** Filtering respects role permissions

---

## 10. Error Handling and Recovery

### 10.1 Failed Assignment Recovery
**Test ID:** INTEGRATION-031  
**Roles:** org_admin, attorney  
**Steps:**
1. Org_admin attempts to assign to invalid attorney
2. Verify error message
3. Verify screening remains unassigned
4. Org_admin corrects and successfully assigns
5. Verify recovery successful

**Expected Result:** System handles assignment errors gracefully

---

### 10.2 Message Delivery Failure Recovery
**Test ID:** INTEGRATION-032  
**Roles:** attorney, client  
**Steps:**
1. Simulate message sending failure
2. Verify user notified of failure
3. User retries sending
4. Verify message eventually delivered
5. Verify no duplicate messages

**Expected Result:** Message failures handled with retry capability

---

### 10.3 Concurrent Edit Conflict Resolution
**Test ID:** INTEGRATION-033  
**Roles:** attorney, staff  
**Steps:**
1. Attorney and staff edit same screening simultaneously
2. Both attempt to save conflicting changes
3. Verify conflict detected
4. Verify user notified
5. Verify resolution mechanism works
6. Verify data integrity maintained

**Expected Result:** Edit conflicts detected and resolved

---

## 11. Performance and Load Tests

### 11.1 Multiple Clients Submit Simultaneously
**Test ID:** INTEGRATION-034  
**Roles:** client (multiple)  
**Steps:**
1. 10+ clients submit screenings simultaneously
2. Monitor system performance
3. Verify all submissions processed
4. Verify no data loss
5. Verify acceptable response times

**Expected Result:** System handles concurrent submissions

---

### 11.2 Large Screening List Performance
**Test ID:** INTEGRATION-035  
**Roles:** org_admin  
**Steps:**
1. Organization has 100+ screenings
2. Org_admin loads screenings list
3. Measure load time
4. Test filtering and search
5. Verify acceptable performance

**Expected Result:** System performs well with large datasets

---

### 11.3 Complex Flow Execution
**Test ID:** INTEGRATION-036  
**Roles:** client  
**Steps:**
1. Client executes flow with 50+ questions
2. Flow includes complex branching
3. Monitor performance throughout
4. Verify no lag or timeouts
5. Verify all data captured

**Expected Result:** Complex flows execute smoothly

---

## 12. End-to-End Complete Scenarios

### 12.1 Complete Immigration Case Lifecycle
**Test ID:** INTEGRATION-037  
**Roles:** client, org_admin, attorney  
**Steps:**
1. Client discovers service, registers
2. Client completes intake screening
3. Org_admin reviews and assigns to attorney
4. Attorney reviews screening
5. Attorney communicates with client for clarifications
6. Client provides additional documents
7. Attorney submits quote
8. Client accepts quote
9. Attorney marks case as in_progress
10. Attorney completes work
11. Client rates attorney
12. Verify entire lifecycle tracked correctly

**Expected Result:** Complete case lifecycle works end-to-end

---

### 12.2 Law Firm Setup to First Case
**Test ID:** INTEGRATION-038  
**Roles:** super_admin, org_admin, attorney, client  
**Steps:**
1. Super admin creates law firm organization
2. Super admin assigns org_admin
3. Org_admin logs in, invites attorneys
4. Org_admin creates and activates flow
5. Client registers, completes flow
6. Org_admin assigns to attorney
7. Attorney processes case
8. Verify complete firm setup and operation

**Expected Result:** New firm can be set up and operational

---

### 12.3 Multi-Attorney Collaboration
**Test ID:** INTEGRATION-039  
**Roles:** org_admin, attorney (multiple), staff, client  
**Steps:**
1. Complex case assigned to Attorney A
2. Attorney A needs help, discusses with Attorney B
3. Staff provides administrative support
4. Org_admin monitors progress
5. Attorneys collaborate on response
6. Quote submitted collaboratively
7. Client sees seamless service
8. Verify collaboration tracked

**Expected Result:** Team collaboration on cases works effectively

---

## Test Execution Notes

### Prerequisites
- Complete test environment with all roles
- Sample data for all scenarios
- Network conditions to test edge cases
- Performance monitoring tools

### Test Data Requirements
- Multiple test organizations
- Users in each role for each organization
- Various screenings in different states
- Active and inactive flows
- Test documents
- Historical data for reporting

### Critical Success Criteria
- ✅ All workflows complete successfully
- ✅ Data remains consistent across all views
- ✅ Permissions strictly enforced
- ✅ No data leakage between organizations
- ✅ No data leakage between users
- ✅ Notifications delivered appropriately
- ✅ System handles concurrent access
- ✅ Performance acceptable under load
- ✅ Errors handled gracefully
- ✅ Complete audit trail maintained

