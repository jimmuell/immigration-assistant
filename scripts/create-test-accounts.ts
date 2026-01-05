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

    // 2. Get or create Test Law Firm org
    let [testLawFirm] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, 'Test Law Firm'))
      .limit(1);

    if (!testLawFirm) {
      console.log("Creating Test Law Firm organization...");
      [testLawFirm] = await db
        .insert(organizations)
        .values({
          name: 'Test Law Firm',
          displayName: 'Test Law Firm',
          type: 'law_firm',
          contactEmail: 'info@testlawfirm.com',
          website: 'https://testlawfirm.com',
          domainKey: 'testlawfirm.com',
        })
        .returning();
      console.log("✅ Test Law Firm created\n");
    } else {
      console.log("✅ Test Law Firm already exists\n");
    }

    // 3. Create test accounts
    const testAccounts = [
      {
        email: 'testclient@test.com',
        password: 'TestClient123!',
        name: 'Test Client',
        role: 'client' as const,
        organizationId: platformOrg.id,
      },
      {
        email: 'testattorney@test.com',
        password: 'TestAttorney123!',
        name: 'Test Attorney',
        role: 'attorney' as const,
        organizationId: testLawFirm.id,
      },
      {
        email: 'teststaff@test.com',
        password: 'TestStaff123!',
        name: 'Test Staff',
        role: 'staff' as const,
        organizationId: testLawFirm.id,
      },
      {
        email: 'testorgadmin@test.com',
        password: 'TestOrgAdmin123!',
        name: 'Test Org Admin',
        role: 'org_admin' as const,
        organizationId: testLawFirm.id,
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

      // If attorney, create attorney profile
      if (account.role === 'attorney') {
        await db.insert(attorneyProfiles).values({
          userId: newUser.id,
          organizationId: account.organizationId,
          bio: 'Test attorney for automated testing',
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

