import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type UserRole = 'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin';

/**
 * Middleware to check if user has required role
 * Use this in server components or route handlers
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/"); // Redirect to home if not authorized
  }
  
  return session;
}

/**
 * Check if user has specific role without redirect
 */
export async function hasRole(role: UserRole) {
  const session = await auth();
  return session?.user?.role === role;
}

/**
 * Get current user session with role
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}
