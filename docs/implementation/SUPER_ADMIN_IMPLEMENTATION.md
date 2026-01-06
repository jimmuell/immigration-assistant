# Super Admin SaaS Implementation - Complete Guide

## Overview

The immigration assistant application has been transformed into a multi-tenant SaaS platform with comprehensive super admin capabilities. This document provides a complete guide to the implementation, setup, and usage.

## Architecture Summary

### Multi-Tenancy Model
- **Shared Schema Approach**: All organizations share the same database with `organization_id` filtering
- **Data Isolation**: Every user, screening, flow, conversation, and quote is scoped to an organization
- **Context Switching**: Super admins can view any organization's dashboard as if they were an org admin

### User Roles

1. **super_admin**: Platform-level administrator
   - Manages all organizations
   - Creates organizations and assigns org admins
   - Can view any organization's dashboard (context switching)
   - **Exclusive flow management access** (create, edit, delete, activate flows)
   - Has access to `/super-admin` routes

2. **org_admin**: Organization-level administrator
   - Manages their organization
   - Can onboard attorneys and staff
   - Manages screenings and users within their organization
   - **Read-only access to flows** (can view and preview only)
   - Must contact Super Admin for flow creation/modification
   - Has access to `/admin` routes

3. **attorney**: Legal professional
   - Views and manages assigned screenings
   - Provides quotes to clients
   - Has enhanced profile with bio, specialties, ratings
   - Has access to `/attorney` routes

4. **client**: End user
   - Uses the AI assistant for immigration guidance
   - Submits screenings
   - Receives quotes from attorneys
   - Has access to client routes

## Database Schema Changes

### New Tables

#### `organizations`
```sql
- id (uuid, primary key)
- name (text, required)
- type (enum: law_firm, solo_attorney, non_legal, other)
- contact_email (text)
- contact_phone (text)
- address (text)
- created_at, updated_at (timestamps)
```

#### `attorney_profiles`
```sql
- id (uuid, primary key)
- user_id (uuid, unique, references users)
- organization_id (uuid, references organizations)
- bio (text)
- specialties (text array)
- years_of_experience (integer)
- bar_number (text)
- bar_state (text)
- rating (decimal, 0-5)
- rating_count (integer)
- created_at, updated_at (timestamps)
```

#### `attorney_ratings`
```sql
- id (uuid, primary key)
- attorney_id (uuid, references users)
- client_id (uuid, references users)
- screening_id (uuid, references screenings)
- rating (integer, 1-5)
- review_text (text)
- created_at (timestamp)
```

### Modified Tables

Added `organization_id` (uuid, NOT NULL) to:
- `users`
- `conversations`
- `flows`
- `screenings`
- `quote_requests`

Updated `users.role` enum to include: `'client' | 'attorney' | 'org_admin' | 'super_admin'`

## Setup Instructions

### 1. Clean Existing Data

```bash
# Run the clean data migration
psql $DATABASE_URL -f migrations/clean_existing_data.sql
```

### 2. Run Database Migrations

```bash
# Run migrations in order
psql $DATABASE_URL -f migrations/add_multi_tenancy.sql
psql $DATABASE_URL -f migrations/add_attorney_profiles.sql
psql $DATABASE_URL -f migrations/add_ratings_system.sql

# Or use Drizzle push
npm run db:push
```

### 3. Create Super Admin Account

```bash
# Using default credentials
npx tsx scripts/seed-super-admin.ts

# Or set custom credentials in .env.local:
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
SUPER_ADMIN_NAME=Your Name

# Then run:
npx tsx scripts/seed-super-admin.ts
```

Default credentials (if not set in .env.local):
- Email: `superadmin@immigration-assistant.com`
- Password: `SuperAdmin123!`

### 4. Start the Application

```bash
npm run dev
```

## User Workflows

### Super Admin Workflow

1. **Login** as super admin at `/login`
   - Redirects to `/super-admin` dashboard

2. **View Platform Statistics**
   - Total organizations
   - Total users by role across all orgs
   - Total screenings and conversations

3. **Create New Organization**
   - Navigate to `/super-admin/organizations/create`
   - Fill in organization details (name, type, contact info)
   - Submit to create organization

4. **Assign Organization Admin**
   - Navigate to `/super-admin/organizations/[id]`
   - Click "Assign Admin"
   - Enter admin credentials (email, name, password)
   - Submit to create org admin account

5. **View Organization as Admin (Context Switching)**
   - From organization detail page, click "View as Admin"
   - Redirected to `/admin` with organization context set
   - Blue banner appears: "Viewing as Organization Admin"
   - All data filtered to that organization
   - Click "Return to Super Admin" to switch back

### Organization Admin Workflow

1. **Login** as org admin at `/login`
   - Redirects to `/admin` dashboard

2. **View Organization Dashboard**
   - See user stats (clients, attorneys, admins)
   - View screenings, conversations, flows

3. **Onboard Attorney**
   - Navigate to `/admin/users` → Attorneys tab
   - Click "Add Attorney"
   - Multi-step form:
     - Step 1: Basic info (email, name, password)
     - Step 2: Professional details (bio, specialties, experience, bar info)
     - Step 3: Review and confirm
   - Submit to create attorney account with profile

4. **Manage Users**
   - View all users in tabs: Attorneys, Clients, Admins
   - See attorney profiles with ratings and specialties
   - Click attorney to view full profile

### Attorney Workflow

1. **Login** as attorney at `/login`
   - Redirects to `/attorney` dashboard

2. **View Profile**
   - Accessible at `/admin/attorneys/[id]`
   - Shows bio, specialties, experience, bar info
   - Displays rating and reviews

3. **Manage Screenings**
   - View assigned screenings
   - Provide quotes to clients
   - Communicate with clients

## Key Features

### ✅ Multi-Tenant Data Isolation
- Every query automatically filtered by `organization_id`
- `requireOrganizationContext()` helper ensures proper scoping
- Foreign key constraints ensure data integrity

### ✅ Super Admin Dashboard
- Platform-wide statistics
- Organization management (create, view, edit)
- Admin assignment
- Context switching to view any organization
- **Exclusive flow management** (see [Flow Management Permissions](../../docs/FLOW_MANAGEMENT_PERMISSIONS.md))

### ✅ Organization Context Switching
- Super admins can view any org's dashboard
- Context stored in secure HTTP-only cookie
- Blue banner indicates viewing mode
- Easy switch back to super admin view

### ✅ Enhanced Attorney Profiles
- Professional biography
- Multiple practice areas/specialties
- Years of experience tracking
- Bar number and state
- Average rating (0-5 stars)
- Rating count and reviews

### ✅ Attorney Rating System
- Clients can rate attorneys (1-5 stars)
- Optional review text
- Linked to specific screenings
- Aggregate rating calculated automatically

### ✅ Attorney Onboarding
- Beautiful multi-step wizard
- Validates all fields
- Creates both user account and profile
- Pre-defined specialty options
- Review step before submission

## API Routes

### Super Admin Routes

- `POST /super-admin/organizations/api` - Create organization
- `POST /super-admin/organizations/[id]/assign-admin/api` - Assign org admin
- `POST /super-admin/organizations/switch-context` - Switch organization context
- `POST /super-admin/organizations/clear-context` - Clear organization context

### Organization Admin Routes

- `POST /admin/attorneys/onboard/api` - Onboard new attorney

## Components

### Super Admin Components

- `/components/super-admin/organization-switcher.tsx` - Context banner
- `/components/super-admin/clear-context-button.tsx` - Return to super admin button

### Attorney Components

- `/components/attorney/rating-display.tsx` - Star rating display (read-only)
- `/components/attorney/rating-input.tsx` - Star rating input (interactive)

## Security Considerations

1. **Role-Based Access Control**
   - Middleware enforces route access based on roles
   - Server-side validation in all API routes
   - `requireRole()` helper for server components

2. **Organization Context Validation**
   - All queries filtered by organization ID
   - Super admins can only view orgs, not modify without context
   - Context switching validated server-side

3. **Data Isolation**
   - Foreign key constraints ensure data integrity
   - Indexes on organization_id for performance
   - Cascade deletes maintain referential integrity

## Testing Checklist

- [ ] Super admin can login
- [ ] Super admin can create organization
- [ ] Super admin can assign org admin
- [ ] Super admin can switch to org context
- [ ] Super admin can return from org context
- [ ] Org admin can login
- [ ] Org admin can onboard attorney
- [ ] Org admin can view attorney profiles
- [ ] Attorney profiles display correctly
- [ ] Rating system works
- [ ] Data isolation works (users can only see their org's data)
- [ ] Context switching maintains proper data filtering

## Future Enhancements

1. **Billing & Subscriptions**
   - Track usage per organization
   - Implement subscription plans
   - Usage limits and quotas

2. **Custom Branding**
   - Organization logos
   - Custom color schemes
   - Custom domain support

3. **Advanced Analytics**
   - Organization performance metrics
   - Attorney performance tracking
   - Client satisfaction analytics

4. **Client Rating Flow**
   - Automated rating requests after case completion
   - Rating reminder emails
   - Public attorney profiles

5. **Organization Settings**
   - Edit organization details
   - Manage organization admins
   - Delete organizations

## Troubleshooting

### Issue: Can't login after migration
- Ensure you ran the seed script to create super admin
- Check that database migrations completed successfully
- Verify `organization_id` columns were added

### Issue: Data not showing in organization view
- Verify organization context is set correctly
- Check that data has proper `organization_id` values
- Ensure user is in the correct organization

### Issue: Context switching not working
- Clear browser cookies
- Check cookie settings in `organization-context.ts`
- Verify super admin role is set correctly

## Support

For issues or questions about the super admin implementation, please refer to:
- `/docs/UI-UX-GUIDELINES.md` - UI/UX guidelines
- `/ROLE_AUTH.md` - Role-based authentication documentation
- `/SETUP.md` - General setup documentation

---

**Implementation Date**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete

