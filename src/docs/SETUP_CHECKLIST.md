# Super Admin Setup Checklist

Follow this checklist to get your multi-tenant SaaS platform up and running.

## Prerequisites

- [ ] PostgreSQL database running
- [ ] DATABASE_URL set in `.env.local`
- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)

## Step 1: Database Setup

### Option A: Using npm scripts (Recommended)

```bash
# Run all migrations at once
npm run db:migrate
```

### Option B: Manual migration

```bash
# 1. Clean existing data
psql $DATABASE_URL -f migrations/clean_existing_data.sql

# 2. Add multi-tenancy
psql $DATABASE_URL -f migrations/add_multi_tenancy.sql

# 3. Add attorney profiles
psql $DATABASE_URL -f migrations/add_attorney_profiles.sql

# 4. Add rating system
psql $DATABASE_URL -f migrations/add_ratings_system.sql
```

### Option C: Using Drizzle

```bash
npm run db:push
```

**Checklist:**
- [ ] Database migrations completed successfully
- [ ] No error messages in terminal
- [ ] `organizations` table exists
- [ ] `attorney_profiles` table exists
- [ ] `attorney_ratings` table exists
- [ ] `users` table has `organization_id` column

## Step 2: Create Super Admin

### Default Credentials

```bash
npm run db:seed
```

This creates a super admin with:
- Email: `superadmin@immigration-assistant.com`
- Password: `SuperAdmin123!`

### Custom Credentials

Add to `.env.local`:

```env
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
SUPER_ADMIN_NAME=Your Name
```

Then run:

```bash
npm run db:seed
```

**Checklist:**
- [ ] Seed script ran successfully
- [ ] Super admin credentials displayed
- [ ] Credentials saved securely
- [ ] Super admin user created in database

## Step 3: Start Application

```bash
npm run dev
```

**Checklist:**
- [ ] Application starts without errors
- [ ] Can access `http://localhost:3000`
- [ ] No console errors in browser

## Step 4: Test Super Admin Login

1. Navigate to `http://localhost:3000/login`
2. Enter super admin credentials
3. Should redirect to `/super-admin`

**Checklist:**
- [ ] Can login successfully
- [ ] Redirected to super admin dashboard
- [ ] Dashboard loads without errors
- [ ] Can see platform statistics

## Step 5: Create First Organization

1. Click "New Organization" button
2. Fill in organization details:
   - Name: e.g., "Acme Law Firm"
   - Type: Choose appropriate type
   - Contact Email: e.g., "contact@acmelawfirm.com"
   - Contact Phone: Optional
   - Address: Optional
3. Click "Create Organization"

**Checklist:**
- [ ] Organization created successfully
- [ ] Redirected to organization detail page
- [ ] Organization appears in dashboard list

## Step 6: Assign Organization Admin

1. From organization detail page, click "Assign Admin"
2. Fill in admin details:
   - Email: e.g., "admin@acmelawfirm.com"
   - Name: e.g., "John Smith"
   - Password: Min 8 characters
3. Click "Create Admin"

**Checklist:**
- [ ] Admin created successfully
- [ ] Admin appears in organization detail page
- [ ] Can see admin in "Admins" section

## Step 7: Test Organization Context Switching

1. From organization detail page, click "View as Admin"
2. Should redirect to `/admin` dashboard
3. Blue banner should appear: "Viewing as Organization Admin"

**Checklist:**
- [ ] Context switched successfully
- [ ] Blue banner visible
- [ ] Can see organization admin dashboard
- [ ] Data filtered to organization

## Step 8: Test Returning to Super Admin

1. Click "Return to Super Admin" in blue banner
2. Should redirect to `/super-admin`
3. Blue banner should disappear

**Checklist:**
- [ ] Returned to super admin view
- [ ] Banner removed
- [ ] Can see all organizations again

## Step 9: Test Attorney Onboarding

1. While viewing as organization admin, navigate to Users
2. Click "Attorneys" tab
3. Click "Add Attorney"
4. Complete 3-step wizard:
   - **Step 1**: Email, Name, Password
   - **Step 2**: Bio, Specialties, Experience, Bar Info
   - **Step 3**: Review
5. Click "Create Attorney"

**Checklist:**
- [ ] Onboarding wizard works
- [ ] Can navigate between steps
- [ ] Attorney created successfully
- [ ] Redirected to attorney profile

## Step 10: Verify Attorney Profile

1. Should be on attorney profile page
2. Verify all information displays correctly

**Checklist:**
- [ ] Profile shows name, email
- [ ] Bio displays if provided
- [ ] Specialties show as tags
- [ ] Experience shows if provided
- [ ] Bar info displays if provided
- [ ] Rating shows (0.0 initially)

## Step 11: Test Organization Admin Login

1. Logout from super admin
2. Login with org admin credentials
3. Should redirect to `/admin`

**Checklist:**
- [ ] Org admin can login
- [ ] Redirected to admin dashboard
- [ ] Can only see their organization's data
- [ ] No blue banner (not viewing as)

## Step 12: Verify Data Isolation

1. Create second organization as super admin
2. Assign different admin to second organization
3. Login as first org admin
4. Verify cannot see second organization's data

**Checklist:**
- [ ] Each org sees only their data
- [ ] Users filtered by organization
- [ ] Attorneys filtered by organization
- [ ] No cross-organization data leakage

## Troubleshooting

### Can't login after migration
- Verify super admin was created (check database)
- Ensure migrations completed successfully
- Clear browser cache and cookies

### Data not showing
- Check organization context is set
- Verify user is in correct organization
- Check database for organization_id values

### Context switching not working
- Clear browser cookies
- Verify super admin role
- Check cookie settings in browser

### Attorney profile not showing
- Verify attorney_profiles table exists
- Check join in query
- Ensure profile was created during onboarding

## Optional: Verify Database Schema

```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# Check organizations table
\d organizations

# Check attorney_profiles table
\d attorney_profiles

# Check users table (should have organization_id)
\d users

# Exit
\q
```

**Expected Tables:**
- [ ] organizations
- [ ] users (with organization_id)
- [ ] attorney_profiles
- [ ] attorney_ratings
- [ ] conversations (with organization_id)
- [ ] flows (with organization_id)
- [ ] screenings (with organization_id)
- [ ] quote_requests (with organization_id)

## Success! 🎉

If all checklist items are complete, your multi-tenant SaaS platform is ready to use!

## Next Steps

1. **Production Deployment**
   - Set production environment variables
   - Run migrations on production database
   - Create production super admin
   - Change default passwords

2. **Customize**
   - Update branding
   - Customize email templates
   - Configure custom domain

3. **Add More Features**
   - Billing integration
   - Custom organization branding
   - Advanced analytics
   - Client rating workflow

## Support

For detailed documentation, see:
- `SUPER_ADMIN_IMPLEMENTATION.md` - Complete implementation guide
- `IMPLEMENTATION_SUMMARY.md` - Quick reference
- `ROLE_AUTH.md` - Authentication documentation

---

**All checkboxes complete?** You're ready to go! 🚀

