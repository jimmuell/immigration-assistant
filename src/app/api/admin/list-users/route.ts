import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can list all users
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    // Query all users with their organization details
    const allUsers = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userCreatedAt: users.createdAt,
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationDisplayName: organizations.displayName,
        organizationType: organizations.type,
        organizationWebsite: organizations.website,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .orderBy(users.role, users.email);

    // Group by role for better readability
    const usersByRole: Record<string, typeof allUsers> = {};
    allUsers.forEach(user => {
      const role = user.userRole || 'unknown';
      if (!usersByRole[role]) {
        usersByRole[role] = [];
      }
      usersByRole[role].push(user);
    });

    // Calculate summary statistics
    const summary = Object.entries(usersByRole).map(([role, roleUsers]) => ({
      role,
      count: roleUsers.length,
    }));

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      usersByRole,
      summary,
      users: allUsers,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

