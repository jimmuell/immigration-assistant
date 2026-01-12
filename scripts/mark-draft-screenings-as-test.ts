/**
 * Mark Screenings from Draft/Inactive Flows as Test Mode
 * 
 * This script identifies screenings that were created from flows that are:
 * - Draft (isDraft = true)
 * - Inactive (isActive = false)
 * 
 * And marks them as test mode (isTestMode = true) to prevent them from
 * appearing in attorney dashboards.
 * 
 * Usage: npx tsx scripts/mark-draft-screenings-as-test.ts [--dry-run]
 */

import { db } from '../src/lib/db';
import { screenings, flows } from '../src/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

const isDryRun = process.argv.includes('--dry-run');

async function markDraftScreeningsAsTest() {
  console.log('🔍 Finding screenings created from draft or inactive flows...\n');

  try {
    // Find all screenings that:
    // 1. Have a flowId (linked to a specific flow)
    // 2. Are not already marked as test mode
    // 3. The associated flow is draft OR inactive
    const screeningsToUpdate = await db
      .select({
        screening: screenings,
        flow: flows,
      })
      .from(screenings)
      .innerJoin(flows, eq(screenings.flowId, flows.id))
      .where(
        and(
          eq(screenings.isTestMode, false),
          or(
            eq(flows.isDraft, true),
            eq(flows.isActive, false)
          )
        )
      );

    console.log(`Found ${screeningsToUpdate.length} screenings from draft/inactive flows:\n`);

    if (screeningsToUpdate.length === 0) {
      console.log('✅ No screenings need to be updated. All good!\n');
      return;
    }

    // Display the screenings that will be updated
    screeningsToUpdate.forEach((item, index) => {
      console.log(`${index + 1}. Screening ID: ${item.screening.id}`);
      console.log(`   Flow: ${item.screening.flowName} (${item.flow.id})`);
      console.log(`   Status: isDraft=${item.flow.isDraft}, isActive=${item.flow.isActive}`);
      console.log(`   Submitted: ${item.screening.createdAt}`);
      console.log(`   Current Status: ${item.screening.status}`);
      console.log();
    });

    if (isDryRun) {
      console.log('🏃 DRY RUN MODE - No changes will be made');
      console.log(`Would update ${screeningsToUpdate.length} screening(s) to isTestMode=true\n`);
      return;
    }

    // Ask for confirmation
    console.log('⚠️  This will mark these screenings as test mode.');
    console.log('   They will no longer appear in attorney dashboards.\n');

    // Update the screenings
    let updatedCount = 0;
    for (const item of screeningsToUpdate) {
      await db
        .update(screenings)
        .set({
          isTestMode: true,
          updatedAt: new Date(),
        })
        .where(eq(screenings.id, item.screening.id));
      
      updatedCount++;
    }

    console.log(`✅ Successfully updated ${updatedCount} screening(s) to test mode\n`);

    // Summary by flow
    const flowSummary = screeningsToUpdate.reduce((acc, item) => {
      const flowKey = `${item.flow.name} (${item.flow.isDraft ? 'draft' : 'published'}, ${item.flow.isActive ? 'active' : 'inactive'})`;
      acc[flowKey] = (acc[flowKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Summary by Flow:');
    Object.entries(flowSummary).forEach(([flow, count]) => {
      console.log(`   ${flow}: ${count} screening(s)`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
markDraftScreeningsAsTest()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
