# Flow Management Permissions

## Overview

Flow management enables both **Super Admins** and **Organization Admins** to create and manage screening flows. Super Admins manage global flows available to all organizations, while Organization Admins manage flows specific to their organization.

## Current Access Policy

### Super Admin (`super_admin`)
**Full Access** - Can perform all flow operations globally:
- ✅ Create new global flows (available to all organizations)
- ✅ View all flows (across all organizations)
- ✅ Edit any flow (global or organization-specific)
- ✅ Delete any flow
- ✅ Preview flows
- ✅ Change flow status (Draft/Inactive/Active)
- ✅ Manage flow permissions

### Organization Admin (`org_admin`)
**Organization-Scoped Access** - Can manage flows for their organization:
- ✅ Create new flows specific to their organization
- ✅ View global flows and their organization's flows
- ✅ Edit their organization's flows
- ✅ Delete their organization's flows
- ✅ Preview flows
- ✅ Change flow status through Draft → Inactive → Active progression
- ✅ Test flows using Test Mode
- ❌ Cannot edit or delete global flows created by Super Admins
- ❌ Cannot view or access flows from other organizations

**What Organization Admins Can Do:**
- Create custom flows tailored to their organization's needs
- Test flows using the built-in Test Mode before activation
- Publish flows when ready for production use
- Manage their organization's screening workflows independently
- View and use global flows created by Super Admins

### Staff (`staff`)
**No Access** - Cannot manage flows:
- ❌ Cannot create, edit, or delete flows
- ⚠️ Can view flows assigned to their organization (read-only)
- ⚠️ Can preview flows to understand screening workflows

**What Staff Members Should Do:**
- Contact their Organization Admin for flow-related questions
- Organization Admin will coordinate with Super Admin/Support as needed

### Attorney (`attorney`) & Client (`client`)
**No Access** - Cannot access flow management interface
- Only interact with flows through the screening process
- Experience flows as end-users during client intake

## Flow Types

### Global Flows
- Created by Super Admins
- Available to all organizations
- Cannot be edited or deleted by Organization Admins
- Marked with a globe icon (🌐) in the UI
- Ensure platform-wide consistency and best practices

### Organization Flows
- Created by Organization Admins
- Specific to a single organization
- Fully manageable by the organization's admins
- Allow customization for specific organizational needs
- Isolated from other organizations

## Flow Status System

The system uses a **simplified 3-state model** that prevents confusion and invalid states:

### Draft
- New flows start as drafts (`isDraft: true, isActive: false`)
- Can be freely edited and modified
- Ideal for testing and iteration
- Use Test Mode to thoroughly test before publishing
- Not available to clients

### Inactive
- Published but not yet live (`isDraft: false, isActive: false`)
- Cannot be edited without returning to draft
- Good for preparing flows in advance
- Not available to clients

### Active
- Published and live (`isDraft: false, isActive: true`)
- Cannot be edited without returning to draft
- Available to clients for screenings
- Monitor for issues and feedback

### State Progression
```
Draft → Inactive → Active
  ↑                   ↓
  └─ Return to Draft ←┘
```

## Rationale

### Why Organization Admin Access?

1. **Organizational Autonomy**: Each organization can create flows tailored to their specific needs
2. **Faster Iteration**: Organizations can create and test flows without waiting for Super Admin
3. **Customization**: Different law firms may have different screening requirements
4. **Scalability**: Reduces bottleneck of having Super Admin manage all flows
5. **Testing Infrastructure**: Built-in Test Mode allows thorough testing before activation
6. **Quality Control**: Draft/publish system ensures flows are ready before use

## User Experience

### For Organization Admins

Organization admins now have full flow management capabilities:

**Access Points:**
- `/admin/flows` - Main flow management interface
- `/admin/flows-editor` - Visual node-based flow editor
- `/test-screenings` - View and manage test screenings

**Workflow:**
1. **Create** a new flow (starts as draft)
2. **Design** using visual editor or markdown content
3. **Test** using Test Mode checkbox when previewing
4. **Iterate** based on test results
5. **Publish** when ready for production
6. **Activate** to make available for client screenings

**UI Features:**
- Clear indication of Global vs Organization flows
- Draft/Published status badges
- Quick toggle between Active/Inactive
- Publish/Unpublish buttons for draft management
- Cannot edit global flows (view/preview only)

### For Staff Members

Staff members have read-only access:

**Access:**
- ✓ View flows (global and organization-specific)
- ✓ Preview flows to understand screening process
- ✓ View test screenings
- ❌ Cannot create, edit, or delete flows

**Note:** Staff should contact their Organization Admin for flow-related needs.

## Implementation Details

### Permission Checks

All flow management actions include role verification and ownership checks:

```typescript
// Server-side permission check
if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
  throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
}

// Ownership check for org admins
if (session.user.role === 'org_admin') {
  if (flow.organizationId !== session.user.organizationId) {
    throw new Error('Unauthorized: You can only manage flows belonging to your organization');
  }
}
```

### Database Schema

```typescript
flows {
  id: uuid
  organizationId: uuid | null  // null = global flow, set = org-specific
  name: text
  description: text
  content: text
  isActive: boolean            // Whether flow is active for screenings
  isDraft: boolean             // Draft vs Published status
  createdAt: timestamp
  updatedAt: timestamp
}
```

### UI Components

- Flow management buttons (Create, Edit, Delete) shown for org_admin and super_admin
- Organization-scoped filtering ensures users only see relevant flows
- Global flows marked with globe icon and read-only for org admins
- Draft/Published status clearly indicated with badges
- Publish/Unpublish actions available for flow owners

### Server Actions

All flow management actions enforce permissions and ownership:

- `createFlow` - Create flow (org_admin creates org flows, super_admin creates global flows)
- `updateFlow` - Update flow (org_admin can update own org's flows)
- `deleteFlow` - Delete flow (org_admin can delete own org's flows)
- `toggleFlowActive` - Toggle active status (org_admin for own flows)
- `publishFlow` - Publish draft flow (org_admin for own flows)
- `unpublishFlow` - Unpublish to draft (org_admin for own flows)
- `getFlows` - List flows (filtered by organization)
- `getFlowById` - View flow (with ownership check)

## Testing Flows

Organization Admins can thoroughly test flows before activating them:

### Test Mode

**Accessing Test Mode:**
1. Navigate to a flow preview
2. Check the "Test Mode" box at the start screen
3. Complete the flow as you would normally
4. Test submission creates a screening flagged as `isTestMode: true`

**Test Screenings Page:**
- View all test screenings at `/test-screenings`
- Accessible to org_admin, staff, and super_admin
- Test screenings kept separate from real client data
- Easy deletion of test data after testing complete

**Best Practices:**
1. Create flow in draft status
2. Test multiple scenarios using Test Mode
3. Verify all paths and conditional logic
4. Check data collection and validation
5. Publish flow when testing is complete
6. Activate flow for production use
7. Delete test screenings to keep system clean

## Future Considerations

### Potential Enhancements

1. **Flow Templates**: Pre-built flow templates for common immigration scenarios
2. **Flow Versioning**: Track flow changes and allow rollback to previous versions
3. **Collaboration**: Multiple admins working on the same flow with change tracking
4. **Analytics**: Usage statistics and completion rates for flows
5. **A/B Testing**: Test different flow variations to optimize conversion

### Quality Assurance

Current safeguards:
- Draft/publish system prevents accidental activation of incomplete flows
- Test Mode allows thorough testing without affecting real data
- Organization isolation prevents cross-contamination
- Ownership checks ensure only authorized users can modify flows

## Contact & Support

### For Super Admins
- Access flow management at: `/admin/flows` and `/admin/flows-editor`
- Manage global flows available to all organizations
- Monitor and audit organization-specific flows if needed
- Support organizations with flow-related questions

### For Organization Admins
- **Self-Service Access**: `/admin/flows` and `/admin/flows-editor`
- **Full Capabilities**: Create, edit, test, and activate flows independently
- **Testing**: Use Test Mode to validate flows before activation
- **Support Contact**: support@immigration-assistant.com for technical issues

**Recommended Workflow:**
1. Create new flow in draft status
2. Design flow using visual editor
3. Test thoroughly using Test Mode
4. Publish flow when ready
5. Activate for production use
6. Monitor usage and iterate as needed

### For Staff Members
Contact your Organization Admin for flow-related needs. Your admin can create and manage flows for your organization.

---

## Related Documentation

- [Test Screenings](../testing/TEST_SCREENINGS.md)
- [Flow JSON Specification](../FLOW_JSON_SPECIFICATION.md)
- [Flow Parser & UI Mapping](../FLOW_PARSER_UI_MAPPING.md)
- [Visual Flow Editor Guide](../VISUAL_FLOW_EDITOR.md)

---

## Migration Notes

### Database Changes
- Added `isDraft` field to flows table (default: true)
- Existing flows set to `isDraft: false` (already in use)
- Migration file: `migrations/add_is_draft_to_flows.sql`

### Breaking Changes
None. This is a backward-compatible enhancement. Existing flows continue to work as before.

---

**Last Updated**: January 12, 2026  
**Policy Version**: 2.0  
**Status**: ✅ Active  
**Changes**: Added organization admin flow management capabilities with draft/publish system

