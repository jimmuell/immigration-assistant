# Draft Flow Screening Fix

## Issue Description

When an organization admin creates a new flow, it is created with the following default states:
- **Draft** (`isDraft = true`) - Indicates the flow is still being designed/tested
- **Inactive** (`isActive = false`) - Flow is not visible to end users

**Problem:** When admins previewed/tested these draft or inactive flows, the resulting screenings were created with `isTestMode = false`. This caused them to appear in the attorney's screening list, even though they were just test submissions from admin previewing.

### Example Scenario

1. Admin creates a new flow in Test Organization
2. Flow is marked as draft and inactive (not ready for production)
3. Admin tests the flow using the preview feature
4. A screening is created with `isTestMode = false`
5. This screening appears in the attorney's "New Screenings" list ❌

## Root Cause

The screening creation endpoint (`/api/screenings`) was not checking the flow's status (`isDraft` and `isActive`) when determining if a screening should be marked as test mode. It only used the `isTestMode` flag passed from the frontend, which defaulted to `false` when the admin preview didn't have the test mode checkbox visible.

## Solution

### 1. Auto-detect Test Mode Based on Flow Status

Modified `/app/api/screenings/route.ts` to automatically set `isTestMode = true` when:
- The flow is in draft status (`isDraft = true`), OR
- The flow is inactive (`isActive = false`)

```typescript
// Auto-detect if this should be a test screening
// Screenings from draft or inactive flows should always be marked as test mode
let shouldBeTestMode = isTestMode;
if (flowId) {
  const [flow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, flowId))
    .limit(1);
  
  if (flow && (flow.isDraft || !flow.isActive)) {
    shouldBeTestMode = true;
  }
}
```

### 2. Improved Flow Preview Modal

Updated the `FlowPreviewModal` component to:
- Accept and pass the `userRole` prop to `FlowRenderer`
- Show admins the test mode checkbox in preview
- Update the description to clarify automatic test mode behavior

### 3. Pass User Role Through Component Chain

Updated the flow editor to pass user role through:
- `FlowEditorClient` receives `userRole` prop
- Passes it to `FlowPreviewModal`
- Which passes it to `FlowRenderer`

This ensures admins see the test mode checkbox when previewing flows.

## How It Works Now

### For Draft/Inactive Flows

1. Admin creates a new flow (draft + inactive by default)
2. Admin previews/tests the flow
3. **Automatic behavior:** Screening is created with `isTestMode = true`
4. Screening does NOT appear in attorney views ✅
5. Admin can still manually uncheck test mode if needed (though not recommended for draft flows)

### For Published/Active Flows

1. Admin publishes a flow (sets `isDraft = false`)
2. Admin activates a flow (sets `isActive = true`)
3. Clients complete the flow
4. Screenings are created with `isTestMode = false` (unless explicitly checked)
5. Screenings appear in attorney views for real case work ✅

## Benefits

1. **Prevents Test Pollution:** Draft flow submissions don't clutter attorney dashboards
2. **Admin Testing:** Admins can freely test flows without worrying about creating fake screenings
3. **Automatic Protection:** Works even if admin forgets to check test mode
4. **Clear Workflow:** Draft/Inactive → Test Mode, Published/Active → Production

## Testing Recommendations

When creating and testing flows:

1. **During Development:** Create flows as draft, test freely - all submissions auto-marked as test
2. **Before Publishing:** Thoroughly test with test mode enabled
3. **After Publishing:** Only publish when ready for real client submissions
4. **Quality Assurance:** Use the test mode checkbox for additional QA on published flows

## Related Documentation

- [Org Admin Flow Management Implementation](../implementation/ORG_ADMIN_FLOW_MANAGEMENT_IMPLEMENTATION.md)
- [Flow Management Permissions](../implementation/FLOW_MANAGEMENT_PERMISSIONS.md)
- [Org Admin Flow Quick Start](../guides/ORG_ADMIN_FLOW_QUICK_START.md)

## Files Modified

1. `/src/app/api/screenings/route.ts` - Auto-detect test mode based on flow status
2. `/src/components/flow-editor/FlowPreviewModal.tsx` - Pass userRole prop
3. `/src/app/admin/flows-editor/[id]/flow-editor-client.tsx` - Accept and pass userRole
4. `/src/app/admin/flows-editor/[id]/page.tsx` - Provide userRole from session
