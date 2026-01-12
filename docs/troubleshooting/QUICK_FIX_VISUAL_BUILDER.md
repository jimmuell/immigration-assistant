# Quick Fix: Visual Builder Empty Canvas

## Problem
When clicking the "Visual Builder" button for the "Asylum or Protection From Persecution" flow, the canvas was empty.

## Solution Applied ✅

The issue has been fixed! The visual builder data has been synced from the flow's JSON content.

### What Was Done

1. Created a sync script that:
   - Extracted the JSON flow definition from the markdown content
   - Created 11 visual nodes in the `formNodes` table
   - Created 12 connections in the `formEdges` table
   - Calculated auto-layout positions for all nodes

2. Verified the data:
   - ✓ 1 start node
   - ✓ 4 yes-no nodes
   - ✓ 3 text input nodes
   - ✓ 2 form nodes
   - ✓ 1 end node
   - ✓ 12 connections between nodes

### Test the Fix

1. Navigate to `/admin/flows` in your browser
2. Find "Asylum or Protection From Persecution-ai-prompt"
3. Click the "Visual Builder" button
4. You should now see the flow displayed on the canvas with all nodes and connections

## If You Add More Flows

If you add new flows via the markdown editor and need to sync them to the visual builder, run:

```bash
npx tsx scripts/sync-flow-to-visual-builder.ts
```

Or to sync all flows at once:

```bash
npx tsx scripts/sync-all-flows-to-visual-builder.ts
```

## Verification

To verify any flow has visual builder data:

```bash
npx tsx scripts/verify-visual-builder-data.ts
```

## Scripts Created

- `scripts/sync-flow-to-visual-builder.ts` - Syncs the Asylum flow
- `scripts/sync-all-flows-to-visual-builder.ts` - Syncs all flows
- `scripts/verify-visual-builder-data.ts` - Verifies the data is correct

## Documentation

See `/docs/troubleshooting/VISUAL_BUILDER_EMPTY_CANVAS.md` for detailed technical information about this issue and how to prevent it in the future.

