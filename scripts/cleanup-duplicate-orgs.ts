import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing anything else
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function cleanupDuplicateOrgs() {
  try {
    console.log('🧹 Cleaning up duplicate Platform Administration organizations...\n');

    // First, let's see what we have
    const allPlatformOrgs = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.name, 'Platform Administration'));

    console.log(`Found ${allPlatformOrgs.length} "Platform Administration" organization(s):`);
    allPlatformOrgs.forEach((org, index) => {
      console.log(`  ${index + 1}. ID: ${org.id}, Created: ${org.createdAt}`);
    });

    if (allPlatformOrgs.length <= 1) {
      console.log('\n✅ No duplicates found. Nothing to clean up!');
      return;
    }

    console.log('\n📋 Starting cleanup process...');

    // Find the oldest one (the one to keep)
    const primaryOrg = allPlatformOrgs.reduce((oldest, current) => {
      return new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest;
    });

    console.log(`\n✅ Keeping primary organization: ${primaryOrg.id} (created: ${primaryOrg.createdAt})`);

    // Find duplicates
    const duplicateOrgs = allPlatformOrgs.filter(org => org.id !== primaryOrg.id);
    console.log(`\n🗑️  Will remove ${duplicateOrgs.length} duplicate(s):`);
    duplicateOrgs.forEach((org, index) => {
      console.log(`  ${index + 1}. ID: ${org.id}, Created: ${org.createdAt}`);
    });

    // Update users from duplicate orgs to primary org
    for (const duplicateOrg of duplicateOrgs) {
      const usersToMove = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.organizationId, duplicateOrg.id));

      if (usersToMove.length > 0) {
        console.log(`\n📦 Moving ${usersToMove.length} user(s) from duplicate org ${duplicateOrg.id} to primary org...`);
        
        await db
          .update(schema.users)
          .set({ organizationId: primaryOrg.id })
          .where(eq(schema.users.organizationId, duplicateOrg.id));
        
        console.log(`✅ Moved ${usersToMove.length} user(s)`);
      }
    }

    // Delete duplicate organizations
    console.log('\n🗑️  Deleting duplicate organizations...');
    for (const duplicateOrg of duplicateOrgs) {
      await db
        .delete(schema.organizations)
        .where(eq(schema.organizations.id, duplicateOrg.id));
      console.log(`✅ Deleted duplicate org: ${duplicateOrg.id}`);
    }

    // Verify final state
    const finalCheck = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.name, 'Platform Administration'));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ CLEANUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Final count: ${finalCheck.length} "Platform Administration" organization(s)`);
    if (finalCheck.length === 1) {
      console.log(`ID: ${finalCheck[0].id}`);
      console.log(`Created: ${finalCheck[0].createdAt}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the cleanup function
cleanupDuplicateOrgs()
  .then(() => {
    console.log('✨ Cleanup script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });

