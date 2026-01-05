import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import postgres from 'postgres';
import { readFileSync } from 'fs';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function addTestModeColumn() {
  try {
    console.log('🔄 Adding is_test_mode column to screenings table...\n');

    // Read the migration file
    const migrationSQL = readFileSync(
      resolve(__dirname, '../migrations/add_is_test_mode.sql'),
      'utf-8'
    );

    // Execute the migration
    await client.unsafe(migrationSQL);

    console.log('✅ Successfully added is_test_mode column!\n');
    console.log('📝 The following changes were made:');
    console.log('   - Added is_test_mode column (BOOLEAN, default FALSE)');
    console.log('   - Created index on is_test_mode for efficient filtering');
    console.log('   - All existing screenings are marked as is_test_mode = false\n');

  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Column is_test_mode already exists, skipping...');
    } else {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

addTestModeColumn()
  .then(() => {
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

