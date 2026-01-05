# Immigration Assistant

A multi-tenant SaaS platform for immigration screening and attorney matching built with Next.js.

## Project Overview

The Immigration Assistant helps users understand U.S. immigration options through guided screening flows, connects them with qualified attorneys, and streamlines the attorney-client workflow.

### Key Features

- 🏢 **Multi-tenant Architecture**: Separate organizations with data isolation
- 👥 **Role-based Access Control**: 5 user roles (client, attorney, staff, org_admin, super_admin)
- 📋 **Dynamic Flow System**: Configurable screening questionnaires
- 💬 **AI Chat Integration**: Gemini-powered immigration guidance
- 📊 **Admin Dashboards**: Organization and platform-wide analytics
- 🔐 **Secure Authentication**: NextAuth with role-based permissions

### User Roles

- **Client**: Complete screenings, receive attorney quotes
- **Attorney**: Manage cases, provide quotes, view client details
- **Staff**: Support attorneys with case management
- **Organization Admin**: Manage organization users and settings
- **Super Admin**: Platform administration and flow management

## Important: Flow Management Policy

⚠️ **Flow management operations (create, edit, delete, activate) are restricted to Super Admins only.**

- **Organization Admins** and **Staff** have read-only access to flows
- For flow creation or modification requests, contact your Super Admin or support
- This ensures platform consistency, quality control, and centralized governance

See [Flow Management Permissions](./docs/FLOW_MANAGEMENT_PERMISSIONS.md) for the complete policy.

## Documentation

📚 **Key Documentation Files**:

- [Setup Guide](./src/docs/SETUP.md) - Development environment setup
- [Super Admin Implementation](./src/docs/SUPER_ADMIN_IMPLEMENTATION.md) - Multi-tenancy and admin features
- [Role-Based Authentication](./src/docs/ROLE_AUTH.md) - User roles and permissions
- [Flow Management Permissions](./docs/FLOW_MANAGEMENT_PERMISSIONS.md) - ⭐ **Flow management access policy**
- [Flow JSON Specification](./src/docs/FLOW_JSON_SPECIFICATION.md) - How to create screening flows
- [Testing Documentation](./docs/testing/README.md) - Comprehensive test plans

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
