# Test Accounts for Role-Based Testing

## Purpose
These test accounts are permanent fixtures for testing role-based functionality. **DO NOT DELETE THESE ACCOUNTS.**

## Test Account Credentials

### Client Role ✅ CREATED
- **Email:** `testclient@test.com`
- **Password:** `TestClient123!`
- **Name:** Test Client
- **Organization:** Platform Administration
- **Role:** client
- **Status:** ✅ VERIFIED WORKING

### Attorney Role ✅ CREATED
- **Email:** `testattorney@test.com`
- **Password:** `123456` (default - can reset to `12345678`)
- **Name:** Test Attorney
- **Organization:** Test Law Firm
- **Role:** attorney
- **Status:** ✅ CREATED - NEEDS LOGIN TEST

### Staff Role ✅ CREATED
- **Email:** `teststaff@test.com`
- **Password:** `123456` (default - can reset to `12345678`)
- **Name:** Test Staff
- **Organization:** Test Law Firm
- **Role:** staff
- **Status:** ✅ CREATED - NEEDS LOGIN TEST

### Organization Admin Role ✅ CREATED
- **Email:** `testorgadmin@test.com`
- **Password:** `TestOrgAdmin123!`
- **Name:** Test Org Admin
- **Organization:** Test Law Firm
- **Role:** org_admin
- **Status:** ✅ VERIFIED WORKING

### Super Admin Role ✅ PRE-EXISTING
- **Email:** `superadmin@immigration-assistant.com`
- **Password:** `SuperAdmin123!`
- **Name:** Super Administrator
- **Organization:** Platform Administration
- **Role:** super_admin
- **Status:** ✅ VERIFIED WORKING

---

## Quick Sign-In Button Configuration

Update the login page quick sign-in buttons to use these accounts:

```typescript
// Client button
email: testclient@test.com
password: TestClient123!

// Attorney button  
email: testattorney@test.com
password: TestAttorney123!

**Quick Login Buttons:**
- Client button → testclient@test.com / TestClient123!
- Attorney button → testattorney@test.com / TestAttorney123!
- Super Admin button → superadmin@immigration-assistant.com / SuperAdmin123!

## Additional Test Accounts

### Perry Mason's Practice
- **Org Admin/Attorney:** perry.mason@masonlaw.com / 12345678
- **Staff:** jimmuell@aol.com / 12345678

### Test Law Firm
- **Org Admin:** testadmin@test.com / TestAdmin123!
- **Attorney:** testattorney@test.com / TestAttorney123!
- **Client:** testclient@test.com / TestClient123!

### Platform Administration
- **Super Admin:** superadmin@immigration-assistant.com / SuperAdmin123!

// Super Admin button (already correct)
email: superadmin@immigration-assistant.com
password: SuperAdmin123!
```

---

## Test Organization

**Name:** Test Law Firm  
**Type:** law_firm  
**Contact Email:** info@testlawfirm.com  
**Purpose:** Dedicated organization for testing multi-role functionality

---

## Creation Script

Run this script to create all test accounts:

```bash
pnpm tsx scripts/create-test-accounts.ts
```

---

## Account Usage Guidelines

1. **Never delete these accounts** - they are for permanent testing use
2. Reset passwords only if necessary, but keep them documented here
3. Each role should have minimal but representative data
4. Clean up test data (screenings, messages, etc.) periodically but keep the accounts
5. Update this document if credentials change

---

## Verification Checklist

After creation, verify each account:
- [ ] Client can log in and access `/client`
- [ ] Attorney can log in and access `/attorney`  
- [ ] Staff can log in and access `/admin` and `/attorney`
- [ ] Org Admin can log in and access `/admin`
- [ ] Super Admin can log in and access `/super-admin`

---

**Last Updated:** January 5, 2026  
**Status:** Accounts pending creation

