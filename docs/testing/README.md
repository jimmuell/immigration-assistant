# Immigration Assistant - User Role Testing Documentation

## Overview
This directory contains comprehensive test plans for the Immigration Assistant application's user role system. The test plans ensure that all roles function correctly, permissions are properly enforced, and workflows operate seamlessly across role boundaries.

## System Roles
The application supports five distinct user roles:
- **client** - End users who complete immigration forms
- **attorney** - Legal professionals who review cases and provide services
- **staff** - Support personnel (paralegals, secretaries) who assist attorneys
- **org_admin** - Organization administrators who manage their firm
- **super_admin** - Platform administrators with system-wide access

## Test Plan Structure

### Individual Role Test Plans
Each role has a dedicated test plan covering all functionality available to that role:

1. **[01_AUTHENTICATION_TESTING.md](./01_AUTHENTICATION_TESTING.md)**
   - Login and registration for all roles
   - Role-based redirects
   - Access control and route protection
   - Session management
   - API endpoint security

2. **[02_CLIENT_ROLE_TESTING.md](./02_CLIENT_ROLE_TESTING.md)**
   - Client dashboard
   - Flow execution and completion
   - Screening management (saved and completed)
   - Attorney communication
   - Quote management
   - Document upload/download
   - Attorney rating system

3. **[03_ATTORNEY_ROLE_TESTING.md](./03_ATTORNEY_ROLE_TESTING.md)**
   - Attorney dashboard
   - Case management
   - New screening claims
   - Client communication
   - Quote creation and management
   - Document management
   - Attorney profile management
   - Rating and review system

4. **[04_ORG_ADMIN_ROLE_TESTING.md](./04_ORG_ADMIN_ROLE_TESTING.md)**
   - Admin dashboard
   - User management
   - Team management (staff and attorneys)
   - Screening assignment and oversight
   - **Flow viewing (read-only)** - Cannot create, edit, or delete flows
   - Attorney management
   - Organization settings
   - Full attorney functionality access
   
   ⚠️ **Note**: Flow management (create, edit, delete) is restricted to super_admin only. See [Flow Management Permissions](../FLOW_MANAGEMENT_PERMISSIONS.md)

5. **[05_STAFF_ROLE_TESTING.md](./05_STAFF_ROLE_TESTING.md)**
   - Admin dashboard access
   - Screening assignment
   - Limited user management
   - Attorney functionality access
   - Support role capabilities
   - Permission boundaries

6. **[06_SUPER_ADMIN_ROLE_TESTING.md](./06_SUPER_ADMIN_ROLE_TESTING.md)**
   - Platform-wide dashboard
   - Organization CRUD operations
   - Organization admin assignment
   - Context switching
   - Platform-wide data access
   - **Exclusive flow management** (create, edit, delete, activate flows)
   - System settings and maintenance
   - Security and audit functions

### Cross-Functional Test Plans

7. **[07_CROSS_ROLE_INTEGRATION_TESTING.md](./07_CROSS_ROLE_INTEGRATION_TESTING.md)**
   - Multi-role workflows
   - Client-attorney interactions
   - Admin-attorney coordination
   - Staff collaboration
   - Multi-organization scenarios
   - Permission boundary enforcement
   - Data consistency across roles
   - End-to-end complete scenarios

## Test Execution Strategy

### Phase 1: Individual Role Testing
Execute tests in this order:
1. Authentication and access control tests
2. Client role tests
3. Attorney role tests
4. Staff role tests
5. Org admin role tests
6. Super admin role tests

**Rationale:** Build from most restricted to most privileged roles, ensuring base functionality before testing administrative features.

### Phase 2: Integration Testing
After all individual role tests pass:
- Execute cross-role integration tests
- Test complete workflows
- Verify data isolation
- Test concurrent access scenarios

### Phase 3: Regression Testing
- Re-run critical tests after any code changes
- Focus on affected roles and workflows
- Verify no regressions in related functionality

## Test Environment Requirements

### User Accounts
Create test accounts for each role:
```
client@test.com (client)
attorney@test.com (attorney)
staff@test.com (staff)
orgadmin@test.com (org_admin)
superadmin@test.com (super_admin)
```

### Organizations
Set up multiple test organizations:
- **Law Firm A** - Full-service immigration law firm
- **Law Firm B** - Solo attorney practice
- **Platform Administration** - System default organization

### Test Data
- Active flows in each organization
- Sample screenings in various statuses
- Test documents for upload/download
- Historical data for reporting
- Test quotes in various states

## Test Execution Checklist

Before beginning testing:
- [ ] All test user accounts created with known passwords
- [ ] Multiple test organizations configured
- [ ] Active flows available for client testing
- [ ] Database in clean, known state
- [ ] Test documents prepared for upload testing
- [ ] Browser cache and cookies cleared
- [ ] Test environment stable and accessible

## Critical Test Coverage Areas

### Security & Access Control
- ✅ Authentication and authorization
- ✅ Role-based route protection
- ✅ API endpoint security
- ✅ Data isolation between organizations
- ✅ Data isolation between users
- ✅ No privilege escalation possible

### Core Workflows
- ✅ Client flow completion
- ✅ Screening assignment
- ✅ Attorney case management
- ✅ Quote request and response
- ✅ Attorney-client communication
- ✅ Document exchange

### Administrative Functions
- ✅ User management
- ✅ Team management
- ✅ Flow management (super_admin only - create, edit, delete)
- ✅ Flow viewing (org_admin, staff - read-only)
- ✅ Organization management
- ✅ Screening oversight

### Data Integrity
- ✅ Data consistency across views
- ✅ Concurrent edit handling
- ✅ Transaction integrity
- ✅ Audit trail completeness

## Bug Reporting

When a test fails, document:
1. **Test ID** - Reference the specific test
2. **Steps to Reproduce** - Exact steps taken
3. **Expected Result** - What should have happened
4. **Actual Result** - What actually happened
5. **Role** - Which user role was being tested
6. **Environment** - Test environment details
7. **Screenshots/Logs** - Supporting evidence
8. **Severity** - Critical, High, Medium, Low

## Severity Levels

- **Critical** - System crash, data loss, security breach, prevents testing
- **High** - Major feature broken, workaround difficult, affects multiple users
- **Medium** - Feature partially broken, workaround available, affects some users
- **Low** - Minor issue, cosmetic problem, minimal impact

## Success Criteria

Testing is complete when:
- ✅ All test plans executed
- ✅ All critical and high severity bugs resolved
- ✅ No security vulnerabilities found
- ✅ All workflows complete successfully
- ✅ Performance acceptable under expected load
- ✅ Data integrity verified
- ✅ Audit trail complete and accurate

## Test Metrics to Track

- Total tests executed
- Tests passed
- Tests failed
- Tests blocked
- Bugs found by severity
- Bugs fixed
- Test coverage percentage
- Time spent testing each role

## Continuous Testing

### Automated Testing Recommendations
Consider automating:
- Authentication flows
- Basic CRUD operations
- Permission checks
- Data isolation tests
- API endpoint security

### Regression Test Suite
Maintain subset of critical tests for quick regression:
- Login for each role
- Basic workflow for each role
- Permission boundary tests
- Data isolation tests
- Critical integration scenarios

## Notes for Test Execution

### Common Issues to Watch For
- Session timeout during long flows
- Browser caching old data
- Race conditions in concurrent operations
- Notification delivery delays
- Mobile responsiveness issues

### Best Practices
- Clear browser cache between major test sections
- Use incognito/private browsing for multi-role testing
- Document any deviations from test plan
- Take screenshots of unexpected behavior
- Log all test results in real-time

## Contact and Support

For questions about test plans or to report issues:
- Review relevant test plan document
- Check for existing bug reports
- Document new issues with complete details
- Reference specific test IDs in bug reports

---

**Last Updated:** January 2026  
**Version:** 1.0  
**Status:** Ready for Execution

