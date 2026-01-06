# Role-Based Authentication Implementation

This document describes the role-based authentication system implemented in the Immigration Assistant application.

## Overview

The application supports five user roles with hierarchical permissions:
- **Client**: Regular users who use the AI assistant for immigration guidance
- **Attorney**: Legal professionals who can view and manage client information within their organization
- **Staff**: Support staff who assist with screenings and client management within their organization
- **Organization Admin (`org_admin`)**: Organization-level administrators with user management and organization oversight
- **Super Admin (`super_admin`)**: Platform-level administrators with full system access including flow management

## Architecture

### 1. Database Schema
- Added `role` column to `users` table with enum constraint: `['client', 'attorney', 'admin']`
- Default role for new users: `client`
- Location: [`src/lib/db/schema.ts`](src/lib/db/schema.ts)

### 2. Authentication
- Extended NextAuth to include role in JWT token and session
- Role is fetched during login and stored in the session
- Location: [`src/lib/auth.ts`](src/lib/auth.ts)

### 3. Type Definitions
- Updated NextAuth types to include role in User and Session interfaces
- Location: [`src/types/next-auth.d.ts`](src/types/next-auth.d.ts)

### 4. Middleware
- Route-level protection based on user roles
- `/admin` routes require `admin` role
- `/attorney` routes require `attorney` or `admin` role
- Automatic redirect to home for unauthorized access
- Location: [`src/middleware.ts`](src/middleware.ts)

### 5. Role Middleware Utilities
Helper functions for server-side role checking:
- `requireRole(allowedRoles)`: Enforce role requirements in server components
- `hasRole(role)`: Check if user has specific role
- `getCurrentUser()`: Get current user with role information
- Location: [`src/lib/role-middleware.ts`](src/lib/role-middleware.ts)

## Features by Role

### Client Role
- Access to AI chat interface
- Save and manage conversations
- Complete intake forms
- View saved and completed conversations

### Attorney Role
All client features plus:
- Attorney Dashboard (`/attorney`)
- View all clients
- See client statistics
- View intake forms
- Monitor conversation activity

### Organization Admin Role (`org_admin`)
All attorney features plus:
- Admin Dashboard (`/admin`)
- View all users within their organization (clients, attorneys, admins)
- User management interface for their organization
- Organization statistics
- **Read-only access to flows** (cannot create, edit, or delete)
- Must contact Super Admin for flow management requests

### Super Admin Role (`super_admin`)
All organization admin features plus:
- Super Admin Dashboard (`/super-admin`)
- Manage all organizations
- Create and assign organization admins
- **Full flow management** (create, edit, delete, activate flows)
- Platform-wide statistics
- Organization context switching

## Navigation

### Desktop Sidebar
- Shows role-appropriate menu items
- Attorney Dashboard link (attorneys and admins only)
- Admin Dashboard link (admins only)
- Displays user role badge

### Mobile Tab Bar
- Dynamically filtered based on user role
- Responsive to screen size
- Shows relevant navigation options

## API Endpoints

### Signup (`/api/auth/signup`)
- Accepts optional `role` parameter
- Defaults to `client` if not specified
- Validates role against allowed values

## Database Migration

To add the role column to existing databases:

```sql
ALTER TABLE users 
ADD COLUMN role TEXT NOT NULL DEFAULT 'client' 
CHECK (role IN ('client', 'attorney', 'admin'));
```

Or use the provided migration file: [`migrations/add_role_column.sql`](migrations/add_role_column.sql)

## Usage Examples

### Creating Users with Roles

```typescript
// Client (default)
await fetch('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe'
  })
});

// Attorney
await fetch('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    email: 'attorney@example.com',
    password: 'password123',
    name: 'Jane Attorney',
    role: 'attorney'
  })
});

// Admin
await fetch('/api/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin'
  })
});
```

### Protecting Server Components

```typescript
import { requireRole } from "@/lib/role-middleware";

export default async function AttorneyPage() {
  await requireRole(['attorney', 'admin']);
  
  // Page content for attorneys and admins
  return <div>Attorney Dashboard</div>;
}
```

### Checking Roles in Components

```typescript
import { getCurrentUser } from "@/lib/role-middleware";

export default async function Page() {
  const user = await getCurrentUser();
  
  if (user?.role === 'admin') {
    // Show admin-specific content
  }
}
```

## Security Considerations

1. **Route Protection**: All role checks happen at the middleware level before page render
2. **Server-Side Validation**: Role requirements enforced in server components
3. **Session Security**: Roles stored in JWT tokens, verified on each request
4. **Default Role**: New users default to `client` role for security

## Flow Management Permissions

**Important**: Flow management (create, edit, delete, activate/deactivate) is **restricted to Super Admins only**.

- Organization Admins and Staff can **view** and **preview** flows (read-only)
- For flow creation or modification requests, users should contact their Super Admin or support
- See [Flow Management Permissions](../../docs/FLOW_MANAGEMENT_PERMISSIONS.md) for detailed policy

## Future Enhancements

- [ ] Admin UI for changing user roles
- [ ] Delegated flow creation with approval workflows
- [ ] Audit logging for role changes
- [ ] Multi-role support (users with multiple roles)
- [ ] Attorney-client assignment system
- [ ] Client case management for attorneys
- [ ] Advanced analytics for admins

## Testing

To test different roles:

1. Create users with different roles using the signup API
2. Login with each user type
3. Navigate to role-specific pages
4. Verify proper access control and redirects

## Troubleshooting

### Role not appearing in session
- Clear cookies and re-login
- Verify database migration was applied
- Check that auth.ts includes role in JWT callback

### Unauthorized redirects
- Check middleware.ts for correct role requirements
- Verify user role in database
- Ensure session includes role information

### Navigation items not showing
- Check that session is loaded (`useSession()`)
- Verify filtered arrays include user's role
- Check console for React hydration errors
