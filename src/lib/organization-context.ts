import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export type UserRole = 'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin';

/**
 * Get the current organization ID from session
 * For super admins, this can be overridden by a cookie for context switching
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  // For super admins, check if they're viewing a specific organization
  if (session.user.role === 'super_admin') {
    const cookieStore = await cookies();
    const viewingOrgId = cookieStore.get('viewing_org_id')?.value;
    if (viewingOrgId) {
      return viewingOrgId;
    }
    // Super admin not viewing a specific org - return null
    return null;
  }

  // For all other users, return their organization ID
  return session.user.organizationId;
}

/**
 * Get the current user's organization ID
 * Redirects to login if not authenticated
 * For org_admin and below, returns their organization ID
 * For super_admin, returns the organization they're currently viewing (if any)
 */
export async function requireOrganizationContext(): Promise<string> {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const orgId = await getCurrentOrganizationId();
  
  if (!orgId) {
    // Super admin not viewing any organization
    redirect("/super-admin");
  }

  return orgId;
}

/**
 * Set the organization context for super admins
 * This allows super admins to view an organization's data as if they were an org admin
 */
export async function setOrganizationContext(organizationId: string) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error("Only super admins can switch organization context");
  }

  const cookieStore = await cookies();
  cookieStore.set('viewing_org_id', organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Clear the organization context (return to super admin view)
 */
export async function clearOrganizationContext() {
  const cookieStore = await cookies();
  cookieStore.delete('viewing_org_id');
}

/**
 * Check if the current user is viewing as an organization (context switching)
 */
export async function isViewingAsOrganization(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'super_admin') {
    return false;
  }

  const cookieStore = await cookies();
  return !!cookieStore.get('viewing_org_id')?.value;
}

/**
 * Get the organization ID that super admin is currently viewing
 */
export async function getViewingOrganizationId(): Promise<string | null> {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'super_admin') {
    return null;
  }

  const cookieStore = await cookies();
  return cookieStore.get('viewing_org_id')?.value || null;
}

