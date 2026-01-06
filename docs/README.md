# Immigration Assistant Documentation

Welcome to the comprehensive documentation for the Immigration Assistant application. This documentation covers setup, technical specifications, implementation details, testing procedures, and product information.

## 📚 Documentation Structure

### ⚡ Quick Start
- **[Client Workflow Guide](./QUICK_START_CLIENT_WORKFLOW.md)** - Complete client journey walkthrough

### 🚀 [Setup](./setup/)
Getting started guides and configuration instructions
- [SETUP.md](./setup/SETUP.md) - Main setup guide
- [SETUP_CHECKLIST.md](./setup/SETUP_CHECKLIST.md) - Step-by-step setup checklist
- [README-LOVABLE.md](./setup/README-LOVABLE.md) - Lovable platform specific setup

### 🔧 [Technical](./technical/)
Technical specifications and architecture documentation
- [FLOW_JSON_SPECIFICATION.md](./technical/FLOW_JSON_SPECIFICATION.md) - Flow JSON format specification
- [FLOW_PARSER_UI_MAPPING.md](./technical/FLOW_PARSER_UI_MAPPING.md) - Flow parser and UI mapping
- [ROLE_AUTH.md](./technical/ROLE_AUTH.md) - Role-based authentication and authorization
- [ui-guidelines.md](./technical/ui-guidelines.md) - UI/UX guidelines and standards

### 💻 [Implementation](./implementation/)
Implementation guides and feature documentation
- [STAFF_PRESCREENING_SYSTEM.md](./implementation/STAFF_PRESCREENING_SYSTEM.md) - **NEW** Staff pre-screening and attorney visibility control
- [SCREENING_SUBMISSION_AND_LOCK_SYSTEM.md](./implementation/SCREENING_SUBMISSION_AND_LOCK_SYSTEM.md) - Released screenings and lock workflow
- [PHASE1_IMPLEMENTATION.md](./implementation/PHASE1_IMPLEMENTATION.md) - Phase 1 implementation details
- [IMPLEMENTATION_SUMMARY.md](./implementation/IMPLEMENTATION_SUMMARY.md) - Overall implementation summary
- [SUPER_ADMIN_IMPLEMENTATION.md](./implementation/SUPER_ADMIN_IMPLEMENTATION.md) - Super admin features
- [ORGANIZATION_CRUD_SUMMARY.md](./implementation/ORGANIZATION_CRUD_SUMMARY.md) - Organization management
- [FIRM_ORGANIZATION_IMPLEMENTATION.md](./implementation/FIRM_ORGANIZATION_IMPLEMENTATION.md) - Firm/organization structure
- [TEAM_MANAGEMENT.md](./implementation/TEAM_MANAGEMENT.md) - Team management features
- [SOLO_ATTORNEY_WORKFLOW.md](./implementation/SOLO_ATTORNEY_WORKFLOW.md) - Solo attorney workflow
- [FLOW_MANAGEMENT_PERMISSIONS.md](./implementation/FLOW_MANAGEMENT_PERMISSIONS.md) - Flow permissions system
- [FLOW_PERMISSIONS_CODE_UPDATE.md](./implementation/FLOW_PERMISSIONS_CODE_UPDATE.md) - Flow permissions updates
- [ENHANCED_FIRM_MATCHING.md](./implementation/ENHANCED_FIRM_MATCHING.md) - Firm matching enhancements

### 🧪 [Testing](./testing/)
Test plans, test results, and testing documentation
- [README.md](./testing/README.md) - Testing overview
- [TEST_ACCOUNTS.md](./testing/TEST_ACCOUNTS.md) - Test account credentials

**Test Plans:**
- [01_AUTHENTICATION_TESTING.md](./testing/01_AUTHENTICATION_TESTING.md)
- [02_CLIENT_ROLE_TESTING.md](./testing/02_CLIENT_ROLE_TESTING.md)
- [03_ATTORNEY_ROLE_TESTING.md](./testing/03_ATTORNEY_ROLE_TESTING.md)
- [04_ORG_ADMIN_ROLE_TESTING.md](./testing/04_ORG_ADMIN_ROLE_TESTING.md)
- [05_STAFF_ROLE_TESTING.md](./testing/05_STAFF_ROLE_TESTING.md)
- [06_SUPER_ADMIN_ROLE_TESTING.md](./testing/06_SUPER_ADMIN_ROLE_TESTING.md)
- [07_CROSS_ROLE_INTEGRATION_TESTING.md](./testing/07_CROSS_ROLE_INTEGRATION_TESTING.md)

**Test Results:**
- [PHASE1_TEST_RESULTS.md](./testing/PHASE1_TEST_RESULTS.md)
- [PHASE2_TEST_RESULTS.md](./testing/PHASE2_TEST_RESULTS.md)
- [PHASE1_COMPLETE_RESULTS.md](./testing/PHASE1_COMPLETE_RESULTS.md)
- [PHASE1_ISSUES_AND_FIXES.md](./testing/PHASE1_ISSUES_AND_FIXES.md)
- [PHASE1_PROGRESS_SUMMARY.md](./testing/PHASE1_PROGRESS_SUMMARY.md)
- [TESTING_SESSION_SUMMARY.md](./testing/TESTING_SESSION_SUMMARY.md)
- [FINAL_SESSION_REPORT.md](./testing/FINAL_SESSION_REPORT.md)
- [PHASE_1_AND_2_FINAL_REPORT.md](./testing/PHASE_1_AND_2_FINAL_REPORT.md)

### 📦 [Product](./product/)
Product documentation, summaries, and planning
- [prd.md](./product/prd.md) - Product Requirements Document
- [TESTING_SUMMARY.md](./product/TESTING_SUMMARY.md) - Testing overview and summary
- [DOCUMENTATION_UPDATE_SUMMARY.md](./product/DOCUMENTATION_UPDATE_SUMMARY.md) - Documentation updates
- [UX_IMPROVEMENTS.md](./product/UX_IMPROVEMENTS.md) - UX improvement notes

## 🎯 Quick Links

### For New Users
- ⚡ [Client Workflow Guide](./QUICK_START_CLIENT_WORKFLOW.md) - Start here!
- 📋 [Test Accounts](./testing/TEST_ACCOUNTS.md) - Login credentials

### For Developers
- 🚀 [Setup Guide](./setup/SETUP.md)
- 🔧 [Technical Specifications](./technical/)
- 💻 [Implementation Guides](./implementation/)
- 🔒 [Released Screenings System](./implementation/SCREENING_SUBMISSION_AND_LOCK_SYSTEM.md)
- 🛡️ [Staff Pre-Screening System](./implementation/STAFF_PRESCREENING_SYSTEM.md)

### For Testers
- 🧪 [Testing Documentation](./testing/)
- 📋 [Test Accounts](./testing/TEST_ACCOUNTS.md)

### For Product Managers
- 📦 [Product Requirements](./product/prd.md)
- 📊 [Testing Summary](./product/TESTING_SUMMARY.md)
- 🎨 [UX Improvements](./product/UX_IMPROVEMENTS.md)

## 📊 Project Overview

The Immigration Assistant is a multi-tenant application that connects clients with immigration attorneys through an intelligent screening system. The platform supports multiple roles (client, attorney, org_admin, staff, super_admin) with comprehensive role-based access control.

## 🏗️ Architecture

### Key Features
- **Multi-tenancy** - Organization-based isolation
- **Role-based Access Control** - 5 distinct roles with specific permissions
- **Dynamic Flow System** - Configurable screening flows with global and org-specific options
- **Attorney-Client Communication** - Built-in messaging and document sharing
- **Quote Management** - Attorney quote generation and client acceptance workflow
- **Screening Lock System** - Submit for review with edit protection (Released Screenings)
- **Staff Pre-Screening** - Configurable gatekeeper mode for solo attorneys with staff
- **Attorney Marketplace** - Attorneys can browse all available client screenings
- **Client Organization Assignment** - Clients assigned to attorney's org on quote acceptance

### Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** NextAuth.js
- **UI:** Tailwind CSS + shadcn/ui components
- **Type Safety:** TypeScript

## 📝 Documentation Conventions

- All documentation uses Markdown format
- Code examples include language tags for syntax highlighting
- Links use relative paths when referencing other docs
- Each directory contains focused, related documentation

## 🔄 Recent Updates (January 6, 2026)

- ✅ **Staff Pre-Screening System** - Configurable gatekeeper mode for attorney screening visibility
- ✅ **Attorney Marketplace** - Attorneys can now see all available client screenings
- ✅ **Organization Settings Page** - New settings UI for workflow configuration
- ✅ **Released Screenings Feature** - New tab for locked screenings in attorney review
- ✅ **Screening Lock System** - Submit for review workflow with edit protection
- ✅ **Client Organization Model** - Clients unassigned until quote acceptance
- ✅ **Enhanced Client Dashboard** - Added metrics cards and activity tracking
- ✅ **Quote Accept/Decline** - Functional quote acceptance with org assignment
- ✅ **Attorney Assignment Filtering** - Fixed to show only org attorneys
- ✅ **Global Flows** - Flows visible to all clients (org-specific reserved for future)
- ✅ **Documentation Consolidation** - Merged `/src/docs` into `/docs` with structure
- ✅ **Default Values Support** - Flow nodes properly save and display default values
- ✅ **Button Styling** - Blue backgrounds automatically get white text

---

**Last Updated:** January 6, 2026

