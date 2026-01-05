# Attorney Role Testing Plan

## Overview
This test plan covers all functionality available to users with the `attorney` role. Attorneys manage cases, review screenings, communicate with clients, and submit quotes.

## Test Environment Setup
- Test attorney user: `attorney@test.com`
- Organization with test client screenings
- Sample screenings in various statuses
- Test client accounts for communication testing

---

## 1. Attorney Dashboard Tests

### 1.1 Dashboard Access and Display
**Test ID:** ATTORNEY-001  
**Role:** attorney  
**Steps:**
1. Log in as attorney
2. Navigate to `/attorney` (or verify auto-redirect)
3. Verify dashboard elements:
   - Welcome message with attorney name
   - Stats cards (Assigned Screenings, In Progress, Awaiting Client, Quotes Sent)
   - "My Assigned Screenings" list
4. Verify stats display correct counts

**Expected Result:** Attorney dashboard displays with all elements and accurate data

---

### 1.2 Stats Card Accuracy
**Test ID:** ATTORNEY-002  
**Role:** attorney  
**Steps:**
1. Note counts in database for attorney:
   - Total assigned screenings
   - In progress screenings
   - Awaiting client screenings
   - Quotes sent
2. Compare with dashboard stats
3. Verify all counts match

**Expected Result:** All dashboard statistics are accurate

---

### 1.3 Assigned Screenings List
**Test ID:** ATTORNEY-003  
**Role:** attorney  
**Steps:**
1. View "My Assigned Screenings" section
2. Verify each screening displays:
   - Flow name
   - Client name/avatar
   - Status badge with color coding
   - Last updated date
   - "View Details" button
3. Verify screenings ordered by most recently updated

**Expected Result:** All assigned screenings listed with complete information

---

### 1.4 No Assigned Screenings Display
**Test ID:** ATTORNEY-004  
**Role:** attorney  
**Steps:**
1. Log in as attorney with no assignments
2. Verify empty state displays
3. Verify message: "No assigned screenings yet"

**Expected Result:** User-friendly empty state when no assignments

---

### 1.5 Status Badge Color Coding
**Test ID:** ATTORNEY-005  
**Role:** attorney  
**Steps:**
1. View screenings with different statuses
2. Verify color coding:
   - assigned: blue
   - in_progress: yellow
   - awaiting_client: orange
   - quoted: purple
   - quote_accepted: green
   - reviewed: gray

**Expected Result:** Status badges clearly distinguish screening states

---

## 2. New Screenings Tests

### 2.1 View New Screenings Page
**Test ID:** ATTORNEY-006  
**Role:** attorney  
**Steps:**
1. Navigate to `/attorney/new-screenings`
2. Verify list of unassigned screenings displays
3. Verify screenings from attorney's organization only

**Expected Result:** New screenings page displays unassigned cases

---

### 2.2 Claim New Screening
**Test ID:** ATTORNEY-007  
**Role:** attorney  
**Steps:**
1. From new screenings list, click "Claim" button
2. Verify confirmation dialog
3. Confirm claim
4. Verify screening assigned to attorney
5. Verify screening appears in attorney's assigned list
6. Verify screening removed from new screenings list

**Expected Result:** Attorney can claim unassigned screenings

---

### 2.3 View New Screening Details Preview
**Test ID:** ATTORNEY-008  
**Role:** attorney  
**Steps:**
1. From new screenings list, view screening preview
2. Verify basic information displays:
   - Client name
   - Flow type
   - Submission date
   - Basic responses preview

**Expected Result:** Attorney can preview screening before claiming

---

## 3. Screening Management Tests

### 3.1 View Screening Detail Page
**Test ID:** ATTORNEY-009  
**Role:** attorney  
**Steps:**
1. Click "View Details" on assigned screening
2. Navigate to `/attorney/screenings/[id]`
3. Verify page displays:
   - Client information
   - Screening status
   - Tabs: Responses, Messages, Documents, Quote
   - Status change dropdown

**Expected Result:** Screening detail page displays all information

---

### 3.2 View Responses Tab
**Test ID:** ATTORNEY-010  
**Role:** attorney  
**Steps:**
1. Open screening detail page
2. Click "Responses" tab (or default view)
3. Verify all client responses display
4. Verify questions and answers formatted clearly
5. Verify all submitted data visible

**Expected Result:** Complete screening responses visible and readable

---

### 3.3 Change Screening Status - In Progress
**Test ID:** ATTORNEY-011  
**Role:** attorney  
**Steps:**
1. Open assigned screening
2. Change status to "in_progress"
3. Save status change
4. Verify status updated in database
5. Verify status badge updates
6. Verify client can see updated status

**Expected Result:** Attorney can update screening to in_progress

---

### 3.4 Change Screening Status - Awaiting Client
**Test ID:** ATTORNEY-012  
**Role:** attorney  
**Steps:**
1. Open screening in progress
2. Change status to "awaiting_client"
3. Add note about what's needed (if field available)
4. Save status change
5. Verify status updated
6. Verify client notified (if notifications exist)

**Expected Result:** Attorney can mark screening as awaiting client response

---

### 3.5 Change Screening Status - Reviewed
**Test ID:** ATTORNEY-013  
**Role:** attorney  
**Steps:**
1. Open assigned screening
2. Change status to "reviewed"
3. Save status change
4. Verify status updated

**Expected Result:** Attorney can mark screening as reviewed

---

### 3.6 Cannot Access Unassigned Screening
**Test ID:** ATTORNEY-014  
**Role:** attorney  
**Steps:**
1. Get ID of screening assigned to different attorney
2. Attempt to access via direct URL
3. Verify access denied or redirect
4. Verify appropriate error message

**Expected Result:** Attorney can only access their assigned screenings

---

## 4. Client Communication Tests

### 4.1 View Messages Tab
**Test ID:** ATTORNEY-015  
**Role:** attorney  
**Steps:**
1. Open assigned screening
2. Click "Messages" tab
3. Verify message interface displays
4. Verify existing messages show with sender identification

**Expected Result:** Message interface accessible with message history

---

### 4.2 Send Message to Client
**Test ID:** ATTORNEY-016  
**Role:** attorney  
**Steps:**
1. In Messages tab, type message
2. Click send
3. Verify message appears in conversation
4. Verify message saved to database
5. Verify client can see message (test from client account)

**Expected Result:** Attorney can send messages to client

---

### 4.3 Receive Message from Client
**Test ID:** ATTORNEY-017  
**Role:** attorney  
**Steps:**
1. Client sends message (via client interface)
2. Attorney refreshes or navigates to Messages tab
3. Verify client message displays
4. Verify sender identified as client
5. Verify timestamp displays

**Expected Result:** Attorney can view messages from client

---

### 4.4 Message Notifications
**Test ID:** ATTORNEY-018  
**Role:** attorney  
**Steps:**
1. Client sends new message
2. Check for unread message indicator (if implemented)
3. Verify notification appears on screening card
4. Open messages
5. Verify messages marked as read

**Expected Result:** Attorney notified of new client messages

---

### 4.5 Message Thread Display
**Test ID:** ATTORNEY-019  
**Role:** attorney  
**Steps:**
1. View conversation with multiple back-and-forth messages
2. Verify messages displayed in chronological order
3. Verify clear distinction between attorney and client messages
4. Verify timestamps on all messages

**Expected Result:** Message thread clearly displays conversation history

---

## 5. Quote Management Tests

### 5.1 View Quote Tab
**Test ID:** ATTORNEY-020  
**Role:** attorney  
**Steps:**
1. Open assigned screening
2. Click "Quote" tab
3. Verify quote interface displays

**Expected Result:** Quote tab accessible

---

### 5.2 Create and Submit Quote
**Test ID:** ATTORNEY-021  
**Role:** attorney  
**Steps:**
1. Navigate to Quote tab (no existing quote)
2. Fill in quote form:
   - Amount: $5000
   - Currency: USD
   - Description: "Services included..."
   - Notes: "Internal notes..."
   - Expiration date: +30 days
3. Submit quote
4. Verify quote created in database
5. Verify screening status changed to "quoted"
6. Verify client can see quote

**Expected Result:** Attorney can create and submit quotes

---

### 5.3 Edit Pending Quote
**Test ID:** ATTORNEY-022  
**Role:** attorney  
**Steps:**
1. View pending quote
2. Click edit
3. Modify amount or description
4. Save changes
5. Verify quote updated
6. Verify client sees updated quote

**Expected Result:** Attorney can edit quotes before client accepts

---

### 5.4 View Accepted Quote
**Test ID:** ATTORNEY-023  
**Role:** attorney  
**Steps:**
1. Client accepts quote (via client interface)
2. Attorney views Quote tab
3. Verify quote displays with "Accepted" status
4. Verify quote no longer editable
5. Verify screening status shows "quote_accepted"

**Expected Result:** Attorney can see when quote is accepted

---

### 5.5 View Declined Quote
**Test ID:** ATTORNEY-024  
**Role:** attorney  
**Steps:**
1. Client declines quote (via client interface)
2. Attorney views Quote tab
3. Verify quote displays with "Declined" status
4. Verify reason for decline (if provided)
5. Verify can create new quote

**Expected Result:** Attorney notified of declined quotes and can resubmit

---

### 5.6 Cannot Edit Accepted Quote
**Test ID:** ATTORNEY-025  
**Role:** attorney  
**Steps:**
1. View accepted quote
2. Verify edit button not available
3. Verify quote fields are read-only

**Expected Result:** Accepted quotes cannot be modified

---

### 5.7 Quote Expiration Handling
**Test ID:** ATTORNEY-026  
**Role:** attorney  
**Steps:**
1. View quote past expiration date
2. Verify "Expired" status displayed
3. Verify option to create new quote

**Expected Result:** Expired quotes clearly marked

---

## 6. Document Management Tests

### 6.1 View Documents Tab
**Test ID:** ATTORNEY-027  
**Role:** attorney  
**Steps:**
1. Open assigned screening
2. Click "Documents" tab
3. Verify document interface displays

**Expected Result:** Documents tab accessible

---

### 6.2 Upload Document to Screening
**Test ID:** ATTORNEY-028  
**Role:** attorney  
**Steps:**
1. Navigate to Documents tab
2. Click upload button
3. Select file
4. Add document type/description
5. Upload
6. Verify document appears in list
7. Verify document saved
8. Verify client can see document

**Expected Result:** Attorney can upload documents to client screening

---

### 6.3 View Client-Uploaded Documents
**Test ID:** ATTORNEY-029  
**Role:** attorney  
**Steps:**
1. Client uploads document (via client interface)
2. Attorney navigates to Documents tab
3. Verify client document visible
4. Verify uploader identified as client

**Expected Result:** Attorney can view client-uploaded documents

---

### 6.4 Download Documents
**Test ID:** ATTORNEY-030  
**Role:** attorney  
**Steps:**
1. Click download on any document
2. Verify file downloads correctly
3. Verify file contents intact

**Expected Result:** Attorney can download all screening documents

---

### 6.5 Delete Document
**Test ID:** ATTORNEY-031  
**Role:** attorney  
**Steps:**
1. Upload a document
2. Click delete button
3. Confirm deletion
4. Verify document removed from list
5. Verify document deleted from storage

**Expected Result:** Attorney can delete documents they uploaded

---

### 6.6 Cannot Delete Client Documents
**Test ID:** ATTORNEY-032  
**Role:** attorney  
**Steps:**
1. View client-uploaded document
2. Verify delete button not available or restricted
3. Verify only client can delete their own documents

**Expected Result:** Attorney cannot delete client-uploaded documents (or can based on business rules)

---

## 7. Cases Management Tests

### 7.1 View Cases Page
**Test ID:** ATTORNEY-033  
**Role:** attorney  
**Steps:**
1. Navigate to `/attorney/cases`
2. Verify list of all assigned screenings displays
3. Verify filtering options available (if implemented)

**Expected Result:** Cases page shows all attorney's screenings

---

### 7.2 Filter Cases by Status
**Test ID:** ATTORNEY-034  
**Role:** attorney  
**Steps:**
1. On cases page, apply status filter
2. Select specific status (e.g., "in_progress")
3. Verify only screenings with that status display

**Expected Result:** Status filter works correctly

---

### 7.3 Search Cases
**Test ID:** ATTORNEY-035  
**Role:** attorney  
**Steps:**
1. Use search field to search by:
   - Client name
   - Submission ID
   - Flow name
2. Verify search results match query

**Expected Result:** Search functionality works across case data

---

### 7.4 Sort Cases
**Test ID:** ATTORNEY-036  
**Role:** attorney  
**Steps:**
1. Apply sort options:
   - Newest first
   - Oldest first
   - Recently updated
   - Client name (A-Z)
2. Verify sorting works correctly for each option

**Expected Result:** Cases can be sorted by various criteria

---

## 8. Quotes Overview Tests

### 8.1 View Pending Quotes Page
**Test ID:** ATTORNEY-037  
**Role:** attorney  
**Steps:**
1. Navigate to `/attorney/pending-quotes`
2. Verify list of all pending quotes displays
3. Verify each shows:
   - Client name
   - Amount
   - Submission date
   - Expiration date
   - Link to screening

**Expected Result:** Pending quotes page shows all outstanding quotes

---

### 8.2 View Accepted Quotes Page
**Test ID:** ATTORNEY-038  
**Role:** attorney  
**Steps:**
1. Navigate to `/attorney/accepted-quotes`
2. Verify list of accepted quotes displays
3. Verify shows acceptance date
4. Verify links to respective screenings

**Expected Result:** Accepted quotes page shows all accepted quotes

---

### 8.3 Navigate from Quote Overview to Screening
**Test ID:** ATTORNEY-039  
**Role:** attorney  
**Steps:**
1. From pending or accepted quotes page
2. Click to view full screening
3. Verify navigation to screening detail page

**Expected Result:** Can navigate from quotes overview to full screening

---

## 9. Attorney Profile Tests

### 9.1 View Attorney Profile
**Test ID:** ATTORNEY-040  
**Role:** attorney  
**Steps:**
1. Access attorney profile page
2. Verify profile information displays:
   - Name
   - Email
   - Organization
   - Bio (if set)
   - Specialties
   - Years of experience
   - Bar number and state
   - Average rating
   - Number of ratings

**Expected Result:** Attorney profile displays all professional information

---

### 9.2 Edit Attorney Profile
**Test ID:** ATTORNEY-041  
**Role:** attorney  
**Steps:**
1. Navigate to profile edit page
2. Update fields:
   - Bio
   - Specialties (add/remove)
   - Years of experience
   - Bar information
3. Save changes
4. Verify updates saved to database
5. Verify updated info displays on profile

**Expected Result:** Attorney can update their professional profile

---

### 9.3 View Attorney Rating
**Test ID:** ATTORNEY-042  
**Role:** attorney  
**Steps:**
1. View profile with ratings
2. Verify average rating displays
3. Verify rating count displays
4. View individual ratings/reviews (if accessible)

**Expected Result:** Attorney can view their ratings and reviews

---

### 9.4 Cannot Edit Own Rating
**Test ID:** ATTORNEY-043  
**Role:** attorney  
**Steps:**
1. View own ratings
2. Verify cannot edit or delete ratings
3. Verify ratings are client-controlled only

**Expected Result:** Attorneys cannot manipulate their own ratings

---

## 10. Multi-Role Access Tests

### 10.1 Attorney with Org Admin Role
**Test ID:** ATTORNEY-044  
**Role:** attorney + org_admin  
**Steps:**
1. Log in as user with both roles
2. Verify access to attorney dashboard
3. Verify access to admin dashboard
4. Verify can switch between views

**Expected Result:** User with multiple roles can access all appropriate areas

---

### 10.2 Attorney with Staff Role
**Test ID:** ATTORNEY-045  
**Role:** attorney + staff  
**Steps:**
1. Log in as user with both roles
2. Verify access to attorney dashboard
3. Verify access to admin features
4. Verify can perform both attorney and staff functions

**Expected Result:** Staff who are also attorneys have access to both functionalities

---

## 11. Data Isolation Tests

### 11.1 Cannot View Other Attorneys' Screenings
**Test ID:** ATTORNEY-046  
**Role:** attorney  
**Steps:**
1. Log in as attorney A
2. Note screening assigned to attorney B
3. Attempt to access attorney B's screening by URL
4. Verify access denied

**Expected Result:** Attorneys can only view their assigned screenings

---

### 11.2 Organization Data Isolation
**Test ID:** ATTORNEY-047  
**Role:** attorney  
**Steps:**
1. Log in as attorney in Organization A
2. Verify only screenings from Organization A visible
3. Verify cannot access Organization B data

**Expected Result:** Attorneys only see data from their organization

---

### 11.3 Cannot Claim Screening from Other Organization
**Test ID:** ATTORNEY-048  
**Role:** attorney  
**Steps:**
1. Create screening in Organization B
2. Log in as attorney in Organization A
3. Attempt to view or claim Organization B screening
4. Verify not visible in new screenings list

**Expected Result:** Attorneys only see new screenings from their organization

---

## 12. Notification & Updates Tests

### 12.1 New Assignment Notification
**Test ID:** ATTORNEY-049  
**Role:** attorney  
**Steps:**
1. Admin assigns screening to attorney
2. Verify attorney sees notification (if implemented)
3. Verify new screening appears in assigned list

**Expected Result:** Attorney notified of new assignments

---

### 12.2 Client Message Notification
**Test ID:** ATTORNEY-050  
**Role:** attorney  
**Steps:**
1. Client sends message to attorney
2. Verify attorney sees notification
3. Verify unread indicator on screening

**Expected Result:** Attorney notified of new client messages

---

### 12.3 Quote Response Notification
**Test ID:** ATTORNEY-051  
**Role:** attorney  
**Steps:**
1. Client accepts or declines quote
2. Verify attorney sees notification
3. Verify screening status updated in real-time

**Expected Result:** Attorney notified when client responds to quote

---

## Test Execution Notes

### Prerequisites
- Test attorney account in test organization
- Test client accounts for communication
- Sample screenings in various statuses
- Test documents for upload/download
- Test quote data

### Critical Success Criteria
- ✅ Attorney can view all assigned screenings
- ✅ Attorney can update screening statuses
- ✅ Attorney can communicate with clients
- ✅ Attorney can create and manage quotes
- ✅ Attorney can upload and view documents
- ✅ Attorney can claim new screenings
- ✅ Attorney cannot access other attorneys' cases
- ✅ Attorney profile displays ratings correctly
- ✅ All navigation works correctly
- ✅ Data properly isolated by organization

