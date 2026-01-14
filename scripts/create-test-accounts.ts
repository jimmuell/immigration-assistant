// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

// Now import everything else
import { db } from "@/lib/db";
import { users, organizations, attorneyProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createTestAccounts() {
  console.log("🚀 Creating test accounts for role-based testing...\n");

  try {
    // 1. Get or create Platform Administration org
    let [platformOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, 'Platform Administration'))
      .limit(1);

    if (!platformOrg) {
      console.log("Creating Platform Administration organization...");
      [platformOrg] = await db
        .insert(organizations)
        .values({
          name: 'Platform Administration',
          type: 'other',
          contactEmail: 'admin@immigration-assistant.com',
        })
        .returning();
      console.log("✅ Platform Administration created\n");
    } else {
      console.log("✅ Platform Administration already exists\n");
    }

    // 2. Get or create Test Organization
    let [testOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, 'Test Organization'))
      .limit(1);

    if (!testOrg) {
      console.log("Creating Test Organization...");
      [testOrg] = await db
        .insert(organizations)
        .values({
          name: 'Test Organization',
          displayName: 'Test Organization',
          type: 'law_firm',
          contactEmail: 'info@testorg.com',
          website: 'https://testorg.com',
          domainKey: 'testorg.com',
        })
        .returning();
      console.log("✅ Test Organization created\n");
    } else {
      console.log("✅ Test Organization already exists\n");
    }

    // 3. Create test accounts
    const testAccounts = [
      {
        email: 'testclient@test.com',
        password: 'TestClient123!',
        name: 'Test Client',
        role: 'client' as const,
        organizationId: testOrg.id, // Changed to Test Organization
      },
      {
        email: 'testattorney@test.com',
        password: 'TestAttorney123!',
        name: 'Test Attorney (Org Admin)',
        role: 'org_admin' as const, // Changed from attorney to org_admin
        organizationId: testOrg.id, // Changed to Test Organization
      },
      {
        email: 'teststaff@test.com',
        password: 'TestStaff123!',
        name: 'Test Staff',
        role: 'staff' as const,
        organizationId: testOrg.id, // Changed to Test Organization
      },
      {
        email: 'testorgadmin@test.com',
        password: 'TestOrgAdmin123!',
        name: 'Test Org Admin',
        role: 'org_admin' as const,
        organizationId: testOrg.id, // Changed to Test Organization
      },
    ];

    for (const account of testAccounts) {
      // Check if account already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, account.email))
        .limit(1);

      if (existing) {
        console.log(`⏭️  ${account.email} already exists (${account.role})`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, 10);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: account.email,
          password: hashedPassword,
          name: account.name,
          role: account.role,
          organizationId: account.organizationId,
        })
        .returning();

      console.log(`✅ Created ${account.role}: ${account.email}`);

      // If org_admin with attorney email, create attorney profile (org_admins can act as attorneys)
      if (account.role === 'org_admin' && account.email === 'testattorney@test.com') {
        await db.insert(attorneyProfiles).values({
          userId: newUser.id,
          organizationId: account.organizationId,
          bio: account.email === 'testattorney@test.com' 
            ? 'Test attorney with org admin capabilities for testing' 
            : 'Test attorney for automated testing',
          specialties: ['Immigration Law', 'Visa Applications'],
          yearsOfExperience: 5,
          barNumber: 'TEST12345',
          barState: 'CA',
        });
        console.log(`   ✅ Attorney profile created for ${account.email}`);
      }
    }

    console.log("\n✨ Test accounts creation complete!\n");
    console.log("📝 Account credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    testAccounts.forEach(account => {
      console.log(`${account.role.toUpperCase()}: ${account.email} / ${account.password}`);
    });
    console.log("SUPER_ADMIN: superadmin@immigration-assistant.com / SuperAdmin123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error creating test accounts:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createTestAccounts();

