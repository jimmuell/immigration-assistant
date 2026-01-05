import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth();
  
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || 
                     req.nextUrl.pathname.startsWith("/signup");
  
  const isLandingPage = req.nextUrl.pathname.startsWith("/landing");
  const isAttorneyOnboarding = req.nextUrl.pathname.startsWith("/admin/attorneys/onboard");
  const isPublicPage = isLandingPage || isAttorneyOnboarding;
  
  const isSuperAdminPage = req.nextUrl.pathname.startsWith("/super-admin");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin") && !isAttorneyOnboarding;
  const isAttorneyPage = req.nextUrl.pathname.startsWith("/attorney");
  const isHomePage = req.nextUrl.pathname === "/";
  
  // If user is authenticated and trying to access auth pages, redirect based on role
  if (session && isAuthPage) {
    const userRole = session.user.role;
    
    if (userRole === 'super_admin') {
      return NextResponse.redirect(new URL("/super-admin", req.url));
    } else if (userRole === 'org_admin' || userRole === 'staff') {
      return NextResponse.redirect(new URL("/admin", req.url));
    } else if (userRole === 'attorney') {
      return NextResponse.redirect(new URL("/attorney", req.url));
    } else {
      return NextResponse.redirect(new URL("/client", req.url));
    }
  }
  
  // If user is authenticated and on attorney onboarding, redirect to their dashboard
  if (session && isAttorneyOnboarding) {
    const userRole = session.user.role;
    
    if (userRole === 'super_admin') {
      return NextResponse.redirect(new URL("/super-admin", req.url));
    } else if (userRole === 'org_admin' || userRole === 'staff') {
      return NextResponse.redirect(new URL("/admin", req.url));
    } else if (userRole === 'attorney') {
      return NextResponse.redirect(new URL("/attorney", req.url));
    } else {
      return NextResponse.redirect(new URL("/client", req.url));
    }
  }
  
  // Allow authenticated users to view landing page (don't redirect them away)
  
  // If user is not authenticated and trying to access protected pages, redirect to login
  if (!session && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  // Role-based access control
  if (session) {
    const userRole = session.user.role;
    
    // Redirect users from home page to their dashboards
    if (isHomePage) {
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL("/super-admin", req.url));
      } else if (userRole === 'org_admin' || userRole === 'staff') {
        return NextResponse.redirect(new URL("/admin", req.url));
      } else if (userRole === 'attorney') {
        return NextResponse.redirect(new URL("/attorney", req.url));
      } else {
        return NextResponse.redirect(new URL("/client", req.url));
      }
    }
    
    // Super admin pages require super_admin role
    if (isSuperAdminPage && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // Admin pages require org_admin, staff, or super_admin role
    if (isAdminPage && userRole !== 'org_admin' && userRole !== 'staff' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // Attorney pages require attorney, org_admin, staff, or super_admin role
    if (isAttorneyPage && userRole !== 'attorney' && userRole !== 'org_admin' && userRole !== 'staff' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
