# Test Accounts - Updated Configuration

## Overview

All test accounts are now configured under **Test Organization** with proper roles for testing the flow management system.

## Test Accounts

### 🔐 Test Client
- **Email**: `testclient@test.com`
- **Password**: `TestClient123!`
- **Role**: `client`
- **Organization**: Test Organization
- **Access**: Client features only

**Use for**: Testing client-side flow completion, quote requests, and client interactions

---

### 👨‍⚖️ Test Attorney (Org Admin)
- **Email**: `testattorney@test.com`  
- **Password**: `TestAttorney123!`
- **Role**: `org_admin` ⭐
- **Organization**: Test Organization
- **Access**: 
  - ✅ Full Admin Dashboard
  - ✅ Create/Edit/Delete Flows
  - ✅ Visual Flow Editor
  - ✅ All Attorney Features
  - ✅ User Management
  - ✅ Organization Settings

**Use for**: 
- Testing flow creation and management as an organization admin
- Full administrative workflow testing
- Attorney features testing

**🎯 This is your PRIMARY account for testing the new flow management features!**

---

### 👥 Test Staff
- **Email**: `teststaff@test.com`
- **Password**: `TestStaff123!`
- **Role**: `staff`
- **Organization**: Test Organization
- **Access**:
  - ✅ View Flows (read-only)
  - ✅ Preview Flows
  - ✅ Admin Dashboard (limited)
  - ✅ Screening Management
  - ❌ Cannot create/edit flows

**Use for**: Testing staff role permissions and read-only access

---

### 🔑 Test Org Admin
- **Email**: `testorgadmin@test.com`
- **Password**: `TestOrgAdmin123!`
- **Role**: `org_admin`
- **Organization**: Test Organization
- **Access**: Same as Test Attorney (full admin access)

**Use for**: Testing additional org admin scenarios

---

### 👑 Super Admin (Existing)
- **Email**: `superadmin@immigration-assistant.com`
- **Password**: `SuperAdmin123!`
- **Role**: `super_admin`
- **Organization**: Platform Administration
- **Access**: All features across all organizations

**Use for**: Testing global flow management and cross-organization features

---

## Testing Flow Management

### Quick Start for Test Attorney

1. **Sign In**
   ```
   Email: testattorney@test.com
   Password: TestAttorney123!
   ```

2. **Navigate to Flows**
   - Click **Admin** in sidebar
   - Click **Flows**
   - You should see the Flows management page with Create Flow button

3. **Create Your First Flow**
   - Click **Create Flow**
   - Click **Workflow icon** to open visual editor
   - Design your flow
   - Save

4. **Test Your Flow**
   - Click **Preview** on your flow
   - ✅ Check **"Test Mode"** at start
   - Complete the flow
   - View test screening at **/test-screenings**

5. **Publish and Activate**
   - Click **Draft** button → changes to **Published**
   - Click **Inactive** button → changes to **Active**
   - Flow is now available for clients!

### Testing Scenarios

#### Scenario 1: Org Admin Creates Flow
- Sign in as `testattorney@test.com`
- Create a custom flow for Test Organization
- Test using Test Mode
- Publish and activate
- ✅ Should see flow in organization's flows list

#### Scenario 2: Client Uses Flow
- Sign in as `testclient@test.com`
- Complete the flow created by test attorney
- ✅ Client should be able to access and complete the flow

#### Scenario 3: Staff Views Flows
- Sign in as `teststaff@test.com`
- Navigate to Admin → Flows
- ✅ Can view and preview flows
- ❌ Cannot create or edit flows

#### Scenario 4: Cross-Organization Isolation
- Sign in as `testattorney@test.com`
- ✅ Can see global flows (created by super admin)
- ✅ Can see Test Organization flows
- ❌ Cannot see or edit flows from other organizations

#### Scenario 5: Super Admin Access
- Sign in as `superadmin@immigration-assistant.com`
- Create a global flow
- ✅ Global flow visible to all organizations
- ✅ Can edit any organization's flows

## Organization Structure

```
Test Organization
├── Test Attorney (Org Admin) - testattorney@test.com
├── Test Org Admin - testorgadmin@test.com
├── Test Staff - teststaff@test.com
└── Test Client - testclient@test.com

Platform Administration
└── Super Admin - superadmin@immigration-assistant.com

Test Law Firm (Legacy)
└── Test Admin - testadmin@test.com (old account)
```

## What Changed

### Before
- ❌ Test Attorney had `attorney` role
- ❌ Could not access Admin Dashboard
- ❌ Could not create flows
- ❌ Accounts scattered across different organizations

### After
- ✅ Test Attorney has `org_admin` role
- ✅ Full access to Admin Dashboard
- ✅ Can create and manage flows
- ✅ All test accounts in same organization
- ✅ Easier to test workflows together

## Migration Applied

The following changes were made to the database:

1. Created **Test Organization**
2. Updated `testattorney@test.com`:
   - Role: `attorney` → `org_admin`
   - Organization: Test Law Firm → Test Organization
   - Added attorney profile
3. Updated `testclient@test.com`:
   - Organization: Platform Administration → Test Organization
4. Created `teststaff@test.com` in Test Organization
5. Created `testorgadmin@test.com` in Test Organization

## Quick Login Buttons

For your convenience, use these credentials on the login page:

| Button | Email | Password |
|--------|-------|----------|
| Test Attorney (Org Admin) | testattorney@test.com | TestAttorney123! |
| Test Client | testclient@test.com | TestClient123! |
| Test Staff | teststaff@test.com | TestStaff123! |
| Test Org Admin | testorgadmin@test.com | TestOrgAdmin123! |
| Super Admin | superadmin@immigration-assistant.com | SuperAdmin123! |

---

**Ready to test!** Sign in as Test Attorney and start creating flows! 🚀

---

*Last Updated: January 12, 2026*  
*Related: [Org Admin Flow Quick Start](../guides/ORG_ADMIN_FLOW_QUICK_START.md)*
