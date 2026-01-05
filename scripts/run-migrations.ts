import { config } from 'dotenv';
import { resolve } from 'path';

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

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...\n');

    // Step 1: Clean existing data
    console.log('🗑️  Cleaning existing data...');
    await db.execute(sql`DELETE FROM screening_documents`);
    await db.execute(sql`DELETE FROM attorney_client_messages`);
    await db.execute(sql`DELETE FROM quote_requests`);
    await db.execute(sql`DELETE FROM form_edges`);
    await db.execute(sql`DELETE FROM form_nodes`);
    await db.execute(sql`DELETE FROM screenings`);
    await db.execute(sql`DELETE FROM messages`);
    await db.execute(sql`DELETE FROM conversations`);
    await db.execute(sql`DELETE FROM flows`);
    await db.execute(sql`DELETE FROM users`);
    console.log('✅ Existing data cleaned\n');

    // Step 2: Create organizations table if it doesn't exist
    console.log('📁 Creating organizations table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('law_firm', 'solo_attorney', 'non_legal', 'other')),
        contact_email TEXT,
        contact_phone TEXT,
        address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Organizations table created\n');

    // Step 3: Update users table
    console.log('👥 Updating users table...');
    await db.execute(sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await db.execute(sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await db.execute(sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'attorney', 'org_admin', 'super_admin'))`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS users_organization_idx ON users(organization_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users(role)`);
    console.log('✅ Users table updated\n');

    // Step 4: Update other tables
    console.log('📊 Adding organization_id to other tables...');
    await db.execute(sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS conversations_organization_idx ON conversations(organization_id)`);
    
    await db.execute(sql`ALTER TABLE flows ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS flows_organization_idx ON flows(organization_id)`);
    
    await db.execute(sql`ALTER TABLE screenings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS screenings_organization_idx ON screenings(organization_id)`);
    
    await db.execute(sql`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS quote_requests_organization_idx ON quote_requests(organization_id)`);
    console.log('✅ Organization IDs added\n');

    // Step 5: Create attorney_profiles table
    console.log('👨‍⚖️  Creating attorney_profiles table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attorney_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        bio TEXT,
        specialties TEXT[],
        years_of_experience INTEGER,
        bar_number TEXT,
        bar_state TEXT,
        rating REAL NOT NULL DEFAULT 0,
        rating_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS attorney_profiles_organization_idx ON attorney_profiles(organization_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS attorney_profiles_user_idx ON attorney_profiles(user_id)`);
    console.log('✅ Attorney profiles table created\n');

    // Step 6: Create attorney_ratings table
    console.log('⭐ Creating attorney_ratings table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attorney_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attorney_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        screening_id UUID REFERENCES screenings(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS attorney_ratings_attorney_idx ON attorney_ratings(attorney_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS attorney_ratings_client_idx ON attorney_ratings(client_id)`);
    console.log('✅ Attorney ratings table created\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ All migrations completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run db:seed');
    console.log('   2. Start app: npm run dev');
    console.log('   3. Login at http://localhost:3000/login\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations()
  .then(() => {
    console.log('✅ Migration script completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });

