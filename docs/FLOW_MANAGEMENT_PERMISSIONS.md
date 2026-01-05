# Flow Management Permissions

## Overview

Flow management operations are **restricted to Super Admins only**. This ensures platform-level consistency, quality control, and centralized governance of screening flows across all organizations.

## Current Access Policy

### Super Admin (`super_admin`)
**Full Access** - Can perform all flow operations:
- ✅ Create new flows
- ✅ View all flows (across all organizations)
- ✅ Edit existing flows
- ✅ Delete flows
- ✅ Preview flows
- ✅ Activate/deactivate flows
- ✅ Manage flow permissions

### Organization Admin (`org_admin`)
**No Access** - Cannot manage flows directly:
- ❌ Cannot create flows
- ❌ Cannot edit flows
- ❌ Cannot delete flows
- ❌ Cannot activate/deactivate flows
- ⚠️ Can view flows assigned to their organization (read-only)
- ⚠️ Can preview flows to test user experience

**What Organization Admins Should Do:**
- Contact Super Admin for flow creation requests
- Contact Support (support@example.com) for flow modifications
- Use existing flows assigned to their organization
- Preview flows to understand the screening process

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

## Rationale

### Why Super Admin Only?

1. **Platform Consistency**: Ensures all flows meet quality standards and follow best practices
2. **Governance**: Centralized control over screening logic and data collection
3. **Quality Assurance**: Prevents creation of broken or incomplete flows
4. **Legal Compliance**: Ensures flows include appropriate disclaimers and collect required information
5. **User Experience**: Maintains consistent UX across all organizations
6. **Technical Support**: Easier to troubleshoot and maintain flows with centralized management

## User Experience

### For Organization Admins

When attempting to access flow management features, organization admins will see:

```
⚠️ Flow Management Restricted

Flow creation, editing, and management are restricted to Super Administrators to ensure platform consistency and quality.

Need to create or modify a flow?
• Contact your Super Admin
• Email support@immigration-assistant.com
• Describe your screening requirements

You can still:
✓ View flows assigned to your organization
✓ Preview flows to test user experience
✓ Use existing flows for client screenings
```

### For Staff Members

Staff members will see:

```
⚠️ Flow Management Access

You do not have permission to manage flows.

For flow-related questions:
1. Contact your Organization Admin
2. Your admin will coordinate with the Super Admin or Support team

You can still:
✓ View flows (read-only)
✓ Preview flows
```

## Implementation Details

### Permission Checks

All flow management actions include role verification:

```typescript
// Server-side permission check
if (!session || session.user.role !== 'super_admin') {
  throw new Error('Unauthorized: Flow management requires Super Admin role');
}
```

### UI Components

- Flow management buttons (Create, Edit, Delete) are hidden for non-super-admins
- Informational messages guide users to appropriate support channels
- Read-only viewing and preview remain available for org_admin and staff

### API Endpoints

All flow management endpoints enforce super admin role:

- `POST /api/flows` - Create flow (super_admin only)
- `PUT /api/flows/:id` - Update flow (super_admin only)
- `DELETE /api/flows/:id` - Delete flow (super_admin only)
- `PATCH /api/flows/:id/toggle` - Toggle active status (super_admin only)
- `GET /api/flows` - List flows (all authenticated users, filtered by org)
- `GET /api/flows/:id` - View flow (all authenticated users with access)
- `GET /api/flows/:id/preview` - Preview flow (org_admin, staff, super_admin)

## Future Considerations

This permission model may evolve based on platform needs:

### Potential Future Changes

1. **Delegated Flow Creation**: Allow org admins to create flows with super admin approval
2. **Flow Templates**: Provide pre-approved templates that org admins can customize
3. **Sandboxed Editing**: Allow org admins to create draft flows for super admin review
4. **Organization-Specific Flows**: Enable org admins to manage flows exclusive to their organization

### Decision Criteria

Any changes to flow permissions will consider:
- Platform maturity and stability
- Organization feedback and requirements
- Support team capacity
- Quality control mechanisms
- Technical capabilities for approval workflows

## Contact & Support

### For Super Admins
Access flow management at: `/admin/flows` and `/admin/flows-editor`

### For Organization Admins
- **Email**: support@immigration-assistant.com
- **Subject**: Flow Management Request - [Organization Name]
- **Include**: 
  - Type of request (new flow, modification, deletion)
  - Screening requirements and use case
  - Timeline/urgency
  - Any specific questions or data points needed

### For Staff Members
Contact your Organization Admin, who will coordinate with Super Admin/Support as needed.

---

## Related Documentation

- [Super Admin Implementation](../src/docs/SUPER_ADMIN_IMPLEMENTATION.md)
- [Role-Based Authentication](../src/docs/ROLE_AUTH.md)
- [Flow JSON Specification](../src/docs/FLOW_JSON_SPECIFICATION.md)
- [Flow Parser & UI Mapping](../src/docs/FLOW_PARSER_UI_MAPPING.md)

---

**Last Updated**: January 5, 2025  
**Policy Version**: 1.0  
**Status**: ✅ Active

