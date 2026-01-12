import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function addIsDraftField() {
  try {
    console.log('🔄 Adding isDraft field to flows table...\n');

    // Read and execute the migration SQL
    const migrationSQL = readFileSync(
      resolve(__dirname, '../migrations/add_is_draft_to_flows.sql'),
      'utf-8'
    );

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await db.execute(sql.raw(statement));
    }

    console.log('\n✅ isDraft field added successfully!');
    console.log('✅ Existing flows set to isDraft = false\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addIsDraftField()
  .then(() => {
    console.log('✅ Migration script completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
