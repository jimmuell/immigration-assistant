import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing anything else
config({ path: resolve(__dirname, '../.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seedSuperAdmin() {
  try {
    console.log('🌱 Seeding super admin account...\n');

    // Check if Platform Administration organization already exists
    console.log('📁 Checking for default organization...');
    let defaultOrg = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.name, 'Platform Administration'))
      .limit(1)
      .then(orgs => orgs[0]);

    if (!defaultOrg) {
      console.log('📁 Creating default organization...');
      [defaultOrg] = await db
        .insert(schema.organizations)
        .values({
          name: 'Platform Administration',
          type: 'other',
          contactEmail: 'admin@immigration-assistant.com',
        })
        .returning();
      console.log(`✅ Created organization: ${defaultOrg.name} (${defaultOrg.id})\n`);
    } else {
      console.log(`✅ Using existing organization: ${defaultOrg.name} (${defaultOrg.id})\n`);
    }

    // Check if super admin already exists
    const existingSuperAdmin = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'super_admin'))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log('⚠️  Super admin already exists:');
      console.log(`   Email: ${existingSuperAdmin[0].email}`);
      console.log(`   Name: ${existingSuperAdmin[0].name || 'N/A'}`);
      console.log('\nTo create a new super admin, delete the existing one first.\n');
      return;
    }

    // Create super admin user
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@immigration-assistant.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

    console.log('👤 Creating super admin user...');
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const [superAdmin] = await db
      .insert(schema.users)
      .values({
        organizationId: defaultOrg.id,
        email: superAdminEmail,
        name: superAdminName,
        password: hashedPassword,
        role: 'super_admin',
      })
      .returning();

    console.log('✅ Super admin created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SUPER ADMIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${superAdmin.email}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log(`Name:     ${superAdmin.name}`);
    console.log(`ID:       ${superAdmin.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log('⚠️  Change the password after first login.\n');
    
    if (superAdminPassword === 'SuperAdmin123!') {
      console.log('💡 TIP: Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, and');
      console.log('   SUPER_ADMIN_NAME in .env.local for custom credentials.\n');
    }

  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seed function
seedSuperAdmin()
  .then(() => {
    console.log('✨ Seeding complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

