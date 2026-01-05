# Authentication & Role-Based Access Testing

## Overview
This test plan covers authentication functionality, role-based access control, and proper redirects for all user roles in the system.

## Test Environment Setup
- Clean database state
- Test users created for each role:
  - `client@test.com` (client)
  - `attorney@test.com` (attorney)
  - `staff@test.com` (staff)
  - `orgadmin@test.com` (org_admin)
  - `superadmin@test.com` (super_admin)

---

## 1. User Registration Tests

### 1.1 Client Signup
**Test ID:** AUTH-001  
**Role:** Public/Unauthenticated  
**Steps:**
1. Navigate to `/signup`
2. Fill in email, password, and name
3. Submit form with role defaulting to 'client'
4. Verify user is created in database
5. Verify user is assigned to default "Platform Administration" organization
6. Verify successful redirect to `/client` dashboard

**Expected Result:** Client user created successfully and redirected to client dashboard

**Test Data:**
- Email: `newclient@test.com`
- Password: `TestPass123!`
- Name: `Test Client`

---

### 1.2 Attorney Signup with Firm Domain
**Test ID:** AUTH-002  
**Role:** Public/Unauthenticated  
**Steps:**
1. Navigate to `/admin/attorneys/onboard`
2. Enter firm website URL
3. Verify system checks for existing organization by domain
4. Complete attorney registration form
5. Verify attorney profile is created
6. Verify user is assigned correct organization

**Expected Result:** Attorney registered and linked to correct organization

**Test Data:**
- Website: `https://testlawfirm.com`
- Email: `attorney@testlawfirm.com`
- Password: `TestPass123!`

---

### 1.3 Attorney Signup with New Firm
**Test ID:** AUTH-003  
**Role:** Public/Unauthenticated  
**Steps:**
1. Navigate to `/admin/attorneys/onboard`
2. Enter new firm website URL (not in database)
3. System creates new organization
4. Complete attorney registration
5. Verify new organization created
6. Verify attorney is first member of new organization

**Expected Result:** New organization and attorney account created successfully

---

### 1.4 Duplicate Email Prevention
**Test ID:** AUTH-004  
**Role:** Public/Unauthenticated  
**Steps:**
1. Attempt to register with existing email address
2. Verify error message: "User with this email already exists"
3. Verify no duplicate user is created in database

**Expected Result:** Registration blocked with appropriate error message

---

## 2. Login & Session Tests

### 2.1 Client Login
**Test ID:** AUTH-005  
**Role:** client  
**Steps:**
1. Navigate to `/login`
2. Enter client credentials
3. Submit login form
4. Verify redirect to `/client` dashboard
5. Verify session contains correct user data and role

**Expected Result:** Client successfully logged in and redirected to client dashboard

---

### 2.2 Attorney Login
**Test ID:** AUTH-006  
**Role:** attorney  
**Steps:**
1. Navigate to `/login`
2. Enter attorney credentials
3. Submit login form
4. Verify redirect to `/attorney` dashboard
5. Verify session contains correct user data and role

**Expected Result:** Attorney successfully logged in and redirected to attorney dashboard

---

### 2.3 Org Admin Login
**Test ID:** AUTH-007  
**Role:** org_admin  
**Steps:**
1. Navigate to `/login`
2. Enter org admin credentials
3. Submit login form
4. Verify redirect to `/admin` dashboard
5. Verify session contains correct user data and role

**Expected Result:** Org admin successfully logged in and redirected to admin dashboard

---

### 2.4 Staff Login
**Test ID:** AUTH-008  
**Role:** staff  
**Steps:**
1. Navigate to `/login`
2. Enter staff credentials
3. Submit login form
4. Verify redirect to `/admin` dashboard
5. Verify session contains correct user data and role

**Expected Result:** Staff successfully logged in and redirected to admin dashboard

---

### 2.5 Super Admin Login
**Test ID:** AUTH-009  
**Role:** super_admin  
**Steps:**
1. Navigate to `/login`
2. Enter super admin credentials
3. Submit login form
4. Verify redirect to `/super-admin` dashboard
5. Verify session contains correct user data and role

**Expected Result:** Super admin successfully logged in and redirected to super admin dashboard

---

### 2.6 Invalid Credentials
**Test ID:** AUTH-010  
**Role:** Public/Unauthenticated  
**Steps:**
1. Navigate to `/login`
2. Enter invalid email or password
3. Verify error message displayed
4. Verify no session is created
5. Verify user remains on login page

**Expected Result:** Login fails with appropriate error message

---

## 3. Role-Based Redirect Tests

### 3.1 Authenticated User Accessing Login Page
**Test ID:** AUTH-011  
**Roles:** All authenticated  
**Steps:**
1. Log in as each role type
2. Navigate to `/login`
3. Verify redirect based on role:
   - client → `/client`
   - attorney → `/attorney`
   - org_admin → `/admin`
   - staff → `/admin`
   - super_admin → `/super-admin`

**Expected Result:** Authenticated users are redirected to their respective dashboards

---

### 3.2 Root Path Redirect
**Test ID:** AUTH-012  
**Roles:** All authenticated  
**Steps:**
1. Log in as each role type
2. Navigate to `/`
3. Verify redirect based on role:
   - client → `/client`
   - attorney → `/attorney`
   - org_admin → `/admin`
   - staff → `/admin`
   - super_admin → `/super-admin`

**Expected Result:** Root path redirects to role-appropriate dashboard

---

### 3.3 Unauthenticated User Accessing Protected Routes
**Test ID:** AUTH-013  
**Role:** Public/Unauthenticated  
**Steps:**
1. Ensure not logged in
2. Attempt to navigate to protected routes:
   - `/client`
   - `/attorney`
   - `/admin`
   - `/super-admin`
   - `/flow/[any-id]`
3. Verify redirect to `/login` for all routes

**Expected Result:** Unauthenticated users redirected to login page

---

## 4. Role-Based Access Control Tests

### 4.1 Client Accessing Admin Routes
**Test ID:** AUTH-014  
**Role:** client  
**Steps:**
1. Log in as client
2. Attempt to navigate to:
   - `/admin`
   - `/admin/flows`
   - `/admin/users`
   - `/admin/intakes`
3. Verify redirect to `/` (home/dashboard redirect)

**Expected Result:** Client blocked from admin routes and redirected

---

### 4.2 Client Accessing Attorney Routes
**Test ID:** AUTH-015  
**Role:** client  
**Steps:**
1. Log in as client
2. Attempt to navigate to:
   - `/attorney`
   - `/attorney/screenings`
   - `/attorney/cases`
3. Verify redirect to `/` → `/client`

**Expected Result:** Client blocked from attorney routes and redirected

---

### 4.3 Client Accessing Super Admin Routes
**Test ID:** AUTH-016  
**Role:** client  
**Steps:**
1. Log in as client
2. Attempt to navigate to:
   - `/super-admin`
   - `/super-admin/organizations`
3. Verify redirect to `/` → `/client`

**Expected Result:** Client blocked from super admin routes and redirected

---

### 4.4 Attorney Accessing Super Admin Routes
**Test ID:** AUTH-017  
**Role:** attorney  
**Steps:**
1. Log in as attorney
2. Attempt to navigate to:
   - `/super-admin`
   - `/super-admin/organizations`
3. Verify redirect to `/` → `/attorney`

**Expected Result:** Attorney blocked from super admin routes and redirected

---

### 4.5 Org Admin Accessing Super Admin Routes
**Test ID:** AUTH-018  
**Role:** org_admin  
**Steps:**
1. Log in as org_admin
2. Attempt to navigate to:
   - `/super-admin`
   - `/super-admin/organizations`
3. Verify redirect to `/` → `/admin`

**Expected Result:** Org admin blocked from super admin routes and redirected

---

### 4.6 Super Admin Accessing All Routes
**Test ID:** AUTH-019  
**Role:** super_admin  
**Steps:**
1. Log in as super_admin
2. Navigate to:
   - `/super-admin` ✓
   - `/admin` ✓
   - `/attorney` ✓
   - `/client` (should redirect to super-admin)
3. Verify super admin can access admin and attorney routes

**Expected Result:** Super admin has access to all admin and attorney functionality

---

### 4.7 Staff Accessing Attorney Routes
**Test ID:** AUTH-020  
**Role:** staff  
**Steps:**
1. Log in as staff
2. Navigate to `/attorney` routes
3. Verify staff can access attorney functionality

**Expected Result:** Staff has access to attorney routes

---

### 4.8 Org Admin Accessing Attorney Routes
**Test ID:** AUTH-021  
**Role:** org_admin  
**Steps:**
1. Log in as org_admin
2. Navigate to `/attorney` routes
3. Verify org_admin can access attorney functionality

**Expected Result:** Org admin has access to attorney routes

---

## 5. Public Routes Access Tests

### 5.1 Landing Page Access (Unauthenticated)
**Test ID:** AUTH-022  
**Role:** Public/Unauthenticated  
**Steps:**
1. Navigate to `/landing`
2. Verify page loads without redirect
3. Verify public content is visible

**Expected Result:** Landing page accessible to unauthenticated users

---

### 5.2 Landing Page Access (Authenticated)
**Test ID:** AUTH-023  
**Roles:** All authenticated  
**Steps:**
1. Log in as any role
2. Navigate to `/landing`
3. Verify page loads without redirect
4. Verify authenticated users can view landing page

**Expected Result:** Landing page accessible to authenticated users

---

### 5.3 Attorney Onboarding Page Access (Unauthenticated)
**Test ID:** AUTH-024  
**Role:** Public/Unauthenticated  
**Steps:**
1. Navigate to `/admin/attorneys/onboard`
2. Verify page loads without authentication
3. Verify onboarding form is accessible

**Expected Result:** Attorney onboarding publicly accessible

---

### 5.4 Attorney Onboarding Page Access (Authenticated)
**Test ID:** AUTH-025  
**Roles:** All authenticated  
**Steps:**
1. Log in as any role
2. Navigate to `/admin/attorneys/onboard`
3. Verify redirect to role-appropriate dashboard

**Expected Result:** Authenticated users redirected away from onboarding

---

## 6. Session Management Tests

### 6.1 Session Persistence
**Test ID:** AUTH-026  
**Roles:** All  
**Steps:**
1. Log in as any role
2. Navigate to different pages within the application
3. Refresh the page
4. Verify session persists
5. Verify user remains logged in

**Expected Result:** Session persists across page navigation and refresh

---

### 6.2 Logout Functionality
**Test ID:** AUTH-027  
**Roles:** All  
**Steps:**
1. Log in as any role
2. Click logout button/link
3. Verify session is destroyed
4. Verify redirect to login page
5. Attempt to access protected route
6. Verify redirect to login

**Expected Result:** User successfully logged out and session destroyed

---

## 7. API Endpoint Security Tests

### 7.1 Protected API Endpoints - Unauthenticated
**Test ID:** AUTH-028  
**Role:** Public/Unauthenticated  
**Steps:**
1. Make API calls without authentication token:
   - `POST /api/chat`
   - `GET /api/admin/team`
   - `POST /api/screenings`
2. Verify 401/403 responses

**Expected Result:** Unauthenticated API calls blocked

---

### 7.2 Protected API Endpoints - Wrong Role
**Test ID:** AUTH-029  
**Role:** client  
**Steps:**
1. Log in as client
2. Make API calls to admin endpoints:
   - `GET /api/admin/team`
   - `POST /api/admin/team/invite`
3. Verify 403 (Forbidden) response

**Expected Result:** Client blocked from admin API endpoints

---

### 7.3 Public API Endpoints
**Test ID:** AUTH-030  
**Role:** Public/Unauthenticated  
**Steps:**
1. Make API calls to public endpoints:
   - `POST /api/auth/signup`
   - `POST /api/auth/check-firm-domain`
   - `POST /api/auth/attorney-signup`
2. Verify endpoints are accessible

**Expected Result:** Public endpoints accessible without authentication

---

## Test Execution Notes

### Prerequisites
- All test users created with known passwords
- Database in clean state
- Test organization(s) created
- Browser cookies cleared before each test session

### Post-Test Cleanup
- Clear all test user sessions
- Remove test users from database
- Reset test data

### Critical Success Criteria
- ✅ All users can log in with correct credentials
- ✅ All users are redirected to correct dashboards based on role
- ✅ No user can access routes outside their permission level
- ✅ API endpoints properly enforce authentication and authorization
- ✅ Session management works correctly across all scenarios

