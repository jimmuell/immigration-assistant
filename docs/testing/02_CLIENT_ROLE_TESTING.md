# Client Role Testing Plan

## Overview
This test plan covers all functionality available to users with the `client` role. Clients are end-users who complete immigration forms, view their submissions, and interact with assigned attorneys.

## Test Environment Setup
- Test client user: `client@test.com`
- Organization with active flows configured
- Test attorney user for assignment testing
- Sample screening data

---

## 1. Client Dashboard Tests

### 1.1 Dashboard Access and Display
**Test ID:** CLIENT-001  
**Role:** client  
**Steps:**
1. Log in as client
2. Navigate to `/client` (or verify auto-redirect)
3. Verify dashboard elements:
   - Welcome message with user name
   - "Available Immigration Forms" section
   - List of active flows/forms
   - Help section

**Expected Result:** Client dashboard displays correctly with all elements

---

### 1.2 No Active Forms Display
**Test ID:** CLIENT-002  
**Role:** client  
**Steps:**
1. Log in as client in organization with no active flows
2. Verify "No Forms Available Yet" message displays
3. Verify helpful message about forms being prepared

**Expected Result:** User-friendly message when no forms are available

---

### 1.3 Active Forms Display
**Test ID:** CLIENT-003  
**Role:** client  
**Steps:**
1. Log in as client in organization with active flows
2. Verify each active flow displays:
   - Flow name
   - Flow description
   - "Start Form" button
   - Form icon
3. Verify forms are displayed in grid layout (responsive)

**Expected Result:** All active flows displayed with complete information

---

### 1.4 Mobile Navigation
**Test ID:** CLIENT-004  
**Role:** client  
**Steps:**
1. Log in as client on mobile device
2. Verify mobile navigation bar appears at bottom
3. Verify navigation items present
4. Test navigation between sections

**Expected Result:** Mobile-friendly navigation works correctly

---

## 2. Flow Execution Tests

### 2.1 Start New Flow
**Test ID:** CLIENT-005  
**Role:** client  
**Steps:**
1. From client dashboard, click "Start Form" on a flow
2. Verify navigation to `/flow/[id]`
3. Verify flow starts at first step
4. Verify form renders correctly

**Expected Result:** Flow starts successfully and first step displays

---

### 2.2 Complete Simple Flow (Linear)
**Test ID:** CLIENT-006  
**Role:** client  
**Steps:**
1. Start a simple linear flow
2. Answer each question/step
3. Navigate through all steps using "Next" button
4. Submit completed flow
5. Verify redirect to completion page
6. Verify screening saved to database with status "submitted"

**Expected Result:** User can complete entire flow and screening is saved

---

### 2.3 Complete Conditional Flow (Branching)
**Test ID:** CLIENT-007  
**Role:** client  
**Steps:**
1. Start a flow with conditional branching (yes/no questions)
2. Answer questions that trigger different paths
3. Verify correct branch is followed based on answers
4. Complete flow
5. Verify all answers saved correctly

**Expected Result:** Conditional logic works correctly and user follows appropriate path

---

### 2.4 Multiple Choice Questions
**Test ID:** CLIENT-008  
**Role:** client  
**Steps:**
1. Navigate to step with multiple choice question
2. Verify all options display
3. Select an option
4. Verify selection is highlighted
5. Navigate to next step
6. Return to previous step
7. Verify selection is retained

**Expected Result:** Multiple choice questions work correctly and retain selections

---

### 2.5 Text Input Questions
**Test ID:** CLIENT-009  
**Role:** client  
**Steps:**
1. Navigate to step with text input
2. Enter text answer
3. Verify character input works
4. Navigate to next step
5. Return to previous step
6. Verify text is retained

**Expected Result:** Text input works and retains entered data

---

### 2.6 Date Input Questions
**Test ID:** CLIENT-010  
**Role:** client  
**Steps:**
1. Navigate to step with date input
2. Open date picker
3. Select a date
4. Verify date is formatted correctly
5. Navigate to next step and back
6. Verify date is retained

**Expected Result:** Date picker works correctly and retains selection

---

### 2.7 Form Validation
**Test ID:** CLIENT-011  
**Role:** client  
**Steps:**
1. Navigate to required field
2. Attempt to proceed without answering
3. Verify validation error message
4. Enter valid answer
5. Verify validation passes and can proceed

**Expected Result:** Required field validation prevents progress until answered

---

### 2.8 Save Draft Functionality
**Test ID:** CLIENT-012  
**Role:** client  
**Steps:**
1. Start a flow
2. Answer some questions (not complete)
3. Save as draft
4. Verify draft saved with status "draft"
5. Navigate away from flow
6. Return and verify ability to resume

**Expected Result:** Draft is saved and can be resumed later

---

### 2.9 Resume Saved Flow
**Test ID:** CLIENT-013  
**Role:** client  
**Steps:**
1. Have a saved draft flow
2. Navigate to saved flows section
3. Click to resume flow
4. Verify flow resumes at last completed step
5. Verify all previous answers are retained

**Expected Result:** Saved flow can be resumed with all data intact

---

### 2.10 Flow Completion Confirmation
**Test ID:** CLIENT-014  
**Role:** client  
**Steps:**
1. Complete a flow to the end
2. Submit final answers
3. Verify completion/success page displays
4. Verify success message
5. Verify next steps information (if provided)

**Expected Result:** Completion page displays with appropriate messaging

---

## 3. Saved Screenings Tests

### 3.1 View Saved Screenings List
**Test ID:** CLIENT-015  
**Role:** client  
**Steps:**
1. Navigate to `/saved` page
2. Verify list of draft screenings displays
3. Verify each screening shows:
   - Flow name
   - Submission ID
   - Status (draft)
   - Created/updated date
   - Action buttons

**Expected Result:** All saved draft screenings are listed

---

### 3.2 Resume Saved Screening
**Test ID:** CLIENT-016  
**Role:** client  
**Steps:**
1. From saved screenings list, click to resume
2. Verify navigation to flow with preserved progress
3. Verify current step is where user left off

**Expected Result:** Screening resumes at correct step with preserved data

---

### 3.3 Delete Saved Screening
**Test ID:** CLIENT-017  
**Role:** client  
**Steps:**
1. From saved screenings list, click delete
2. Confirm deletion
3. Verify screening removed from list
4. Verify screening deleted from database

**Expected Result:** Saved screening can be deleted

---

### 3.4 No Saved Screenings Display
**Test ID:** CLIENT-018  
**Role:** client  
**Steps:**
1. Navigate to `/saved` with no saved drafts
2. Verify empty state message displays
3. Verify call-to-action to start new form

**Expected Result:** User-friendly empty state when no saved screenings

---

## 4. Completed Screenings Tests

### 4.1 View Completed Screenings List
**Test ID:** CLIENT-019  
**Role:** client  
**Steps:**
1. Navigate to `/completed` page
2. Verify list of completed screenings displays
3. Verify each screening shows:
   - Flow name
   - Submission ID
   - Status
   - Submitted date
   - Assigned attorney (if assigned)
   - "View Details" button

**Expected Result:** All completed screenings are listed with details

---

### 4.2 View Screening Details
**Test ID:** CLIENT-020  
**Role:** client  
**Steps:**
1. From completed list, click "View Details"
2. Navigate to `/completed/[id]`
3. Verify screening details page displays:
   - All submitted answers
   - Current status
   - Assigned attorney info (if assigned)
   - Tabs for: Responses, Messages, Documents, Quotes

**Expected Result:** Detailed view of screening accessible

---

### 4.3 View Screening Responses Tab
**Test ID:** CLIENT-021  
**Role:** client  
**Steps:**
1. Open a completed screening detail page
2. Click "Responses" tab
3. Verify all questions and answers display
4. Verify answers are formatted correctly

**Expected Result:** All screening responses visible in organized format

---

### 4.4 View Screening Status
**Test ID:** CLIENT-022  
**Role:** client  
**Steps:**
1. View completed screenings with different statuses:
   - submitted
   - reviewed
   - assigned
   - in_progress
   - awaiting_client
   - quoted
   - quote_accepted
   - quote_declined
2. Verify each status displays correctly with appropriate styling

**Expected Result:** Status indicators clearly show screening state

---

### 4.5 No Completed Screenings Display
**Test ID:** CLIENT-023  
**Role:** client  
**Steps:**
1. Navigate to `/completed` with no completed screenings
2. Verify empty state message displays
3. Verify call-to-action to start new form

**Expected Result:** User-friendly empty state when no completed screenings

---

## 5. Attorney Communication Tests

### 5.1 View Messages Tab
**Test ID:** CLIENT-024  
**Role:** client  
**Steps:**
1. Open screening detail page with assigned attorney
2. Click "Messages" tab
3. Verify message interface displays
4. Verify existing messages show (if any)

**Expected Result:** Message interface accessible for assigned screenings

---

### 5.2 Send Message to Attorney
**Test ID:** CLIENT-025  
**Role:** client  
**Steps:**
1. In Messages tab, type a message
2. Click send
3. Verify message appears in message list
4. Verify message saved to database
5. Verify message marked as from client

**Expected Result:** Client can send messages to assigned attorney

---

### 5.3 Receive Message from Attorney
**Test ID:** CLIENT-026  
**Role:** client  
**Steps:**
1. Attorney sends message to client (via attorney interface)
2. Client refreshes or navigates to Messages tab
3. Verify attorney message displays
4. Verify sender identified as attorney
5. Verify timestamp displays

**Expected Result:** Client can view messages from attorney

---

### 5.4 Messages Not Available - No Attorney Assigned
**Test ID:** CLIENT-027  
**Role:** client  
**Steps:**
1. Open screening without assigned attorney
2. Click "Messages" tab
3. Verify appropriate message: "No attorney assigned yet"

**Expected Result:** Clear messaging when attorney not yet assigned

---

### 5.5 Message Read Status
**Test ID:** CLIENT-028  
**Role:** client  
**Steps:**
1. View unread messages from attorney
2. Verify unread indicator (if implemented)
3. Open messages
4. Verify messages marked as read

**Expected Result:** Read/unread status tracked correctly

---

## 6. Quote Management Tests

### 6.1 View Quotes Tab
**Test ID:** CLIENT-029  
**Role:** client  
**Steps:**
1. Open screening detail page
2. Click "Quotes" tab
3. Verify quote interface displays

**Expected Result:** Quotes tab accessible

---

### 6.2 View Pending Quote
**Test ID:** CLIENT-030  
**Role:** client  
**Steps:**
1. Open screening with pending quote from attorney
2. Navigate to Quotes tab
3. Verify quote details display:
   - Amount
   - Currency
   - Description/services
   - Expiration date (if set)
   - Accept/Decline buttons

**Expected Result:** Quote details clearly displayed with action buttons

---

### 6.3 Accept Quote
**Test ID:** CLIENT-031  
**Role:** client  
**Steps:**
1. View pending quote
2. Click "Accept" button
3. Confirm acceptance
4. Verify quote status changed to "accepted"
5. Verify screening status updated to "quote_accepted"
6. Verify attorney is notified (check from attorney view)

**Expected Result:** Quote accepted successfully and status updated

---

### 6.4 Decline Quote
**Test ID:** CLIENT-032  
**Role:** client  
**Steps:**
1. View pending quote
2. Click "Decline" button
3. Provide reason (if required)
4. Confirm decline
5. Verify quote status changed to "declined"
6. Verify screening status updated to "quote_declined"

**Expected Result:** Quote declined successfully and status updated

---

### 6.5 View Accepted Quote
**Test ID:** CLIENT-033  
**Role:** client  
**Steps:**
1. Open screening with accepted quote
2. Navigate to Quotes tab
3. Verify accepted quote displays
4. Verify "Accepted" status shown
5. Verify no action buttons (already accepted)

**Expected Result:** Accepted quotes display correctly without duplicate actions

---

### 6.6 View Expired Quote
**Test ID:** CLIENT-034  
**Role:** client  
**Steps:**
1. View quote past expiration date
2. Verify "Expired" status displayed
3. Verify action buttons disabled

**Expected Result:** Expired quotes clearly marked and not actionable

---

### 6.7 No Quotes Available
**Test ID:** CLIENT-035  
**Role:** client  
**Steps:**
1. Open screening with no quotes
2. Navigate to Quotes tab
3. Verify message: "No quotes yet"

**Expected Result:** Clear messaging when no quotes exist

---

## 7. Document Management Tests

### 7.1 View Documents Tab
**Test ID:** CLIENT-036  
**Role:** client  
**Steps:**
1. Open screening detail page
2. Click "Documents" tab
3. Verify document interface displays

**Expected Result:** Documents tab accessible

---

### 7.2 Upload Document
**Test ID:** CLIENT-037  
**Role:** client  
**Steps:**
1. Navigate to Documents tab
2. Click upload button
3. Select file from device
4. Add document type/description
5. Upload file
6. Verify document appears in list
7. Verify document saved to database and storage

**Expected Result:** Client can upload documents to screening

---

### 7.3 View Uploaded Documents List
**Test ID:** CLIENT-038  
**Role:** client  
**Steps:**
1. Navigate to Documents tab with uploaded documents
2. Verify each document shows:
   - File name
   - File type
   - Upload date
   - Uploader name
   - Download/view button

**Expected Result:** All documents listed with complete information

---

### 7.4 Download Document
**Test ID:** CLIENT-039  
**Role:** client  
**Steps:**
1. Click download button on a document
2. Verify file downloads correctly
3. Verify file contents are intact

**Expected Result:** Documents can be downloaded successfully

---

### 7.5 View Attorney-Uploaded Documents
**Test ID:** CLIENT-040  
**Role:** client  
**Steps:**
1. Attorney uploads document (via attorney interface)
2. Client navigates to Documents tab
3. Verify attorney-uploaded document visible
4. Verify uploader identified as attorney

**Expected Result:** Client can view documents uploaded by attorney

---

### 7.6 No Documents Display
**Test ID:** CLIENT-041  
**Role:** client  
**Steps:**
1. Navigate to Documents tab with no uploads
2. Verify empty state message
3. Verify upload button available

**Expected Result:** Clear empty state with option to upload

---

## 8. Attorney Rating Tests

### 8.1 Rate Attorney After Case Completion
**Test ID:** CLIENT-042  
**Role:** client  
**Steps:**
1. Complete case with attorney (quote_accepted status)
2. Access rating interface
3. Select star rating (1-5)
4. Enter review text (optional)
5. Submit rating
6. Verify rating saved to database
7. Verify attorney profile rating updated

**Expected Result:** Client can rate attorney after case completion

---

### 8.2 View Attorney Rating
**Test ID:** CLIENT-043  
**Role:** client  
**Steps:**
1. View assigned attorney profile/info
2. Verify attorney rating displays (if they have ratings)
3. Verify rating is average of all ratings

**Expected Result:** Attorney ratings visible to client

---

### 8.3 Cannot Rate Before Case Completion
**Test ID:** CLIENT-044  
**Role:** client  
**Steps:**
1. Open screening in progress
2. Verify rating interface not available
3. Verify message explaining when rating becomes available

**Expected Result:** Rating only available after appropriate case status

---

### 8.4 Edit Existing Rating
**Test ID:** CLIENT-045  
**Role:** client  
**Steps:**
1. Have existing rating for attorney
2. Access rating interface
3. Modify rating and review
4. Save changes
5. Verify updated rating saved

**Expected Result:** Client can edit their previous rating (if this feature exists)

---

## 9. Navigation & UI Tests

### 9.1 Mobile Bottom Navigation
**Test ID:** CLIENT-046  
**Role:** client  
**Steps:**
1. Access site on mobile device
2. Verify bottom navigation bar displays
3. Test navigation items:
   - Dashboard/Home
   - Saved screenings
   - Completed screenings
   - Profile/Settings
4. Verify active tab highlighted

**Expected Result:** Mobile navigation works correctly on all client pages

---

### 9.2 Desktop Sidebar Navigation
**Test ID:** CLIENT-047  
**Role:** client  
**Steps:**
1. Access site on desktop
2. Verify sidebar displays (if applicable)
3. Test all navigation links
4. Verify active page highlighted

**Expected Result:** Desktop navigation works correctly

---

### 9.3 User Profile Display
**Test ID:** CLIENT-048  
**Role:** client  
**Steps:**
1. Check for user profile section/dropdown
2. Verify user name displays
3. Verify user email displays
4. Verify logout option available

**Expected Result:** User profile information accessible

---

### 9.4 Logout
**Test ID:** CLIENT-049  
**Role:** client  
**Steps:**
1. Click logout button
2. Verify session terminated
3. Verify redirect to login page
4. Attempt to access protected route
5. Verify redirect back to login

**Expected Result:** Client can log out successfully

---

## 10. Data Isolation Tests

### 10.1 Cannot View Other Users' Screenings
**Test ID:** CLIENT-050  
**Role:** client  
**Steps:**
1. Log in as client A
2. Note screening IDs for client A
3. Log out
4. Log in as client B (different organization)
5. Attempt to access client A's screening by direct URL
6. Verify access denied or redirect

**Expected Result:** Clients can only view their own screenings

---

### 10.2 Organization Data Isolation
**Test ID:** CLIENT-051  
**Role:** client  
**Steps:**
1. Log in as client in Organization A
2. Verify only flows from Organization A are visible
3. Verify no data from Organization B is accessible

**Expected Result:** Data properly isolated by organization

---

## Test Execution Notes

### Prerequisites
- Test client accounts in test organizations
- Sample flows configured and active
- Sample completed screenings
- Test attorney for communication testing
- Test documents for upload/download testing

### Critical Success Criteria
- ✅ Client can view and start all available flows
- ✅ Client can complete flows and submit screenings
- ✅ Client can view all their screenings and details
- ✅ Client can communicate with assigned attorney
- ✅ Client can view, accept, and decline quotes
- ✅ Client can upload and download documents
- ✅ Client can rate attorneys
- ✅ Client cannot access other users' data
- ✅ All navigation works correctly on mobile and desktop

