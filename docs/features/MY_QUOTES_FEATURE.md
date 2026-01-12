# My Quotes Feature - Implementation Summary

## Overview

The "My Quotes" feature allows clients to view, accept, or reject quotes from attorneys while implementing safeguards to protect attorney time and prevent accidental cancellations.

## Features Implemented

### 1. Client-Facing Features

#### My Quotes Page (`/my-quotes`)
- **Location**: Accessible from sidebar and mobile tab bar
- **Functionality**:
  - View all quotes from attorneys (pending, accepted, declined)
  - Accept or decline pending quotes
  - Request to undo accepted quotes (with attorney approval required)
  - See detailed quote information including amount, services, and attorney details

#### Quote Status Types
- **Pending**: Client can accept or decline freely
- **Accepted**: Quote is locked, client can only request rejection (requires attorney approval)
- **Declined**: Historical record of declined quotes
- **Expired**: Quotes past their expiration date

#### Safeguards Implemented
1. **Single Acceptance Rule**: Client can only accept ONE quote per screening
   - When a quote is accepted, all other pending quotes are automatically declined
   
2. **Acceptance Lock**: Once accepted, client cannot directly reject
   - Must submit a rejection request with a detailed reason (minimum 10 characters)
   - Attorney must approve the rejection
   
3. **Confirmation Dialogs**: Multiple warnings before accepting a quote
   - Clear explanation of consequences
   - List of what happens when accepting (other quotes declined, commitment to attorney, etc.)

4. **Mistake Rectification**: Controlled undo process
   - Client can request to undo an acceptance
   - Must provide a detailed reason
   - Attorney reviews and can approve or deny
   - Client notified of request status

### 2. Attorney-Facing Features

#### Rejection Requests Page (`/attorney/rejection-requests`)
- **Location**: Accessible from sidebar (new menu item: "Rejection Requests")
- **Functionality**:
  - View all pending rejection requests from clients
  - See client's reason for wanting to undo acceptance
  - Approve rejection requests
  - Contact client directly via email
  - View screening details

#### Approval Process
When attorney approves a rejection:
1. Quote status changes from "accepted" to "declined"
2. Screening is unassigned from attorney
3. Client is disconnected from attorney's organization
4. Client can now accept other quotes
5. All changes are timestamped and tracked

### 3. Database Schema Updates

New fields added to `quote_requests` table:
```sql
- accepted_at: TIMESTAMP        -- When quote was accepted
- declined_at: TIMESTAMP        -- When quote was declined
- rejection_request_reason: TEXT  -- Client's reason for undo request
- rejection_requested_at: TIMESTAMP  -- When client requested undo
- rejection_approved_by: UUID   -- Attorney who approved rejection
- rejection_approved_at: TIMESTAMP  -- When rejection was approved
```

### 4. API Endpoints

#### Client APIs
- `GET /api/client/quotes` - Fetch all quotes for logged-in client
- `POST /api/client/quotes/[id]/accept` - Accept a quote
- `POST /api/client/quotes/[id]/decline` - Decline a quote
- `POST /api/client/quotes/[id]/request-rejection` - Request to undo acceptance

#### Attorney APIs
- `GET /api/attorney/rejection-requests` - Fetch pending rejection requests
- `POST /api/attorney/rejection-requests/[id]/approve` - Approve rejection request

## User Workflows

### Client Workflow: Accepting a Quote

1. Navigate to "My Quotes" from sidebar
2. Review pending quotes with details (amount, services, attorney)
3. Click "Accept Quote" on desired quote
4. Review confirmation dialog with warnings:
   - Other quotes will be declined
   - Cannot freely cancel after acceptance
   - Undo requires attorney approval
5. Confirm acceptance
6. System automatically:
   - Marks quote as accepted
   - Declines all other pending quotes for that screening
   - Assigns attorney to the screening
   - Connects client to attorney's organization

### Client Workflow: Requesting to Undo an Acceptance

1. Navigate to "My Quotes"
2. View accepted quote
3. Click "Request to Undo Acceptance"
4. Provide detailed reason (minimum 10 characters)
5. Submit request
6. See confirmation that request was sent to attorney
7. Wait for attorney review
8. Cannot submit multiple requests for same quote

### Attorney Workflow: Reviewing Rejection Requests

1. Navigate to "Rejection Requests" from sidebar
2. View pending requests with:
   - Client information
   - Quote details
   - Client's reason for rejection
   - Timeline (when accepted, when requested)
3. Review case details
4. Options:
   - Approve rejection (releases client)
   - Contact client to discuss
   - View full screening details
5. If approved:
   - System updates quote status
   - Unassigns case
   - Disconnects client from organization

## Business Logic & Safeguards

### Preventing Time Waste
1. **Acceptance Commitment**: Clear warnings that acceptance is a commitment
2. **Approval Required**: Attorney must approve any undo request
3. **Reason Required**: Client must explain why they want to undo
4. **Audit Trail**: All actions timestamped and tracked

### Allowing Mistake Rectification
1. **Request System**: Client can submit undo request (not blocked entirely)
2. **Attorney Review**: Attorney can evaluate legitimacy of request
3. **Communication**: Built-in contact options for discussion
4. **Transparency**: Client sees status of their request

### Data Integrity
1. **Single Quote Acceptance**: Database constraint prevents multiple acceptances
2. **Status Tracking**: Clear status field with valid states
3. **Timestamps**: All state changes tracked with timestamps
4. **Audit Fields**: Who approved what and when

## UI/UX Features

### Client Interface
- **Color-coded Status**: 
  - Yellow/Amber for pending
  - Green for accepted
  - Gray for declined
- **Clear Warnings**: Multiple levels of confirmation
- **Information Hierarchy**: Important details prominent
- **Responsive Design**: Works on mobile and desktop
- **Loading States**: Clear feedback during actions

### Attorney Interface
- **Request Queue**: Easy to see pending requests
- **Client Context**: All relevant client info visible
- **Action Buttons**: Clear approve/contact/view options
- **Historical View**: See approved rejections

## Navigation Updates

### Desktop Sidebar
- Client: Added "My Quotes" menu item
- Attorney: Added "Rejection Requests" menu item

### Mobile Tab Bar
- Client: Added "Quotes" tab
- Attorney: Rejection requests accessible from desktop only (space constraint)

## Testing Recommendations

### Client Flow Testing
1. Submit a screening
2. Receive multiple quotes from different attorneys
3. Attempt to accept multiple quotes (should fail after first)
4. Accept one quote, verify others auto-declined
5. Request to undo acceptance
6. Verify cannot submit duplicate requests

### Attorney Flow Testing
1. Send quote to client
2. Wait for client to accept
3. Client requests rejection
4. Review request in rejection requests page
5. Approve rejection
6. Verify quote status, screening unassignment, client disconnection

### Edge Cases
1. Expired quotes (past expiresAt date)
2. Rapid-fire acceptance attempts
3. Network failures during acceptance
4. Multiple attorneys for same screening
5. Client with no quotes yet

## Migration

Run the migration to add new fields:
```bash
npx tsx scripts/apply-quote-safeguard-migration.ts
```

Or manually apply:
```bash
psql $DATABASE_URL -f migrations/add_quote_safeguard_fields.sql
```

## Future Enhancements (Optional)

1. **Email Notifications**: Notify attorney when rejection requested
2. **SMS Notifications**: Critical updates via text
3. **Auto-Expiration**: Automatically expire quotes after date
4. **Rejection Analytics**: Track why clients request rejections
5. **Partial Approval**: Allow attorney to modify quote instead of full rejection
6. **Client Notes**: Allow client to add notes when accepting quote
7. **Attorney Response**: Allow attorney to add notes when approving/denying
8. **Dashboard Widgets**: Show rejection request count on attorney dashboard
9. **Quote Comparison**: Side-by-side comparison of multiple quotes
10. **Payment Integration**: Link quote acceptance to payment processing

## Security Considerations

### Implemented
- Role-based access control (clients can only see their quotes)
- Quote ownership verification (can only accept quotes for their screenings)
- Attorney authorization (can only approve for their own quotes)
- Input validation (minimum reason length, status checks)
- SQL injection protection (using Drizzle ORM parameterized queries)

### Additional Recommendations
- Rate limiting on acceptance endpoints
- Audit logging for sensitive actions
- Email verification before quote acceptance
- Two-factor authentication for high-value quotes

## Support & Maintenance

### Common Issues
1. **Client can't find My Quotes**: Check sidebar visibility, role assignment
2. **Attorney can't approve**: Verify quote belongs to attorney, check permissions
3. **Multiple acceptance error**: Expected behavior, verify only one quote accepted
4. **Request submission fails**: Check reason length, verify quote is accepted

### Monitoring
- Track rejection request volume
- Monitor acceptance-to-rejection ratio
- Alert on unusual patterns (many rejections from one client)
- Review reasons for common issues

## Conclusion

The My Quotes feature provides a balanced approach between protecting attorney time and allowing clients to rectify genuine mistakes. The multi-layered safeguards prevent casual cancellations while the request system ensures clients aren't locked into irreversible decisions.
