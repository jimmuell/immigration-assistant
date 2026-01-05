'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserData {
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  userCreatedAt: Date;
  organizationId: string;
  organizationName: string;
  organizationDisplayName: string | null;
  organizationType: string;
  organizationWebsite: string | null;
}

interface UsersResponse {
  success: boolean;
  totalUsers: number;
  usersByRole: Record<string, UserData[]>;
  summary: { role: string; count: number }[];
  users: UserData[];
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-500',
  org_admin: 'bg-blue-500',
  attorney: 'bg-green-500',
  staff: 'bg-yellow-500',
  client: 'bg-gray-500',
};

export default function UsersListPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/admin/list-users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch users');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#ffffff', color: '#dc2626' }}>
        <Card style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
          <CardHeader>
            <CardTitle style={{ color: '#dc2626' }}>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>All Users</h1>
        <p className="text-gray-600">Total users: {data.totalUsers}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {data.summary.map(({ role, count }) => (
          <Card key={role} style={{ backgroundColor: '#f9fafb', color: '#1f2937' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#1f2937' }}>
                {role.replace('_', ' ').toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#1f2937' }}>{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users by Role */}
      {Object.entries(data.usersByRole).map(([role, users]) => (
        <Card key={role} className="mb-6" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
          <CardHeader>
            <CardTitle style={{ color: '#1f2937' }}>
              {role.replace('_', ' ').toUpperCase()} ({users.length})
            </CardTitle>
            <CardDescription style={{ color: '#6b7280' }}>
              All users with the {role} role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.userId}
                  className="border rounded-lg p-4"
                  style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg" style={{ color: '#1f2937' }}>
                        {user.userName || 'No name'}
                      </h3>
                      <p className="text-sm" style={{ color: '#6b7280' }}>{user.userEmail}</p>
                    </div>
                    <Badge className={roleColors[user.userRole] || 'bg-gray-500'}>
                      {user.userRole}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <span className="font-medium" style={{ color: '#1f2937' }}>Organization:</span>{' '}
                      <span style={{ color: '#6b7280' }}>
                        {user.organizationDisplayName || user.organizationName}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: '#1f2937' }}>Type:</span>{' '}
                      <span style={{ color: '#6b7280' }}>{user.organizationType}</span>
                    </div>
                    {user.organizationWebsite && (
                      <div>
                        <span className="font-medium" style={{ color: '#1f2937' }}>Website:</span>{' '}
                        <a
                          href={user.organizationWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: '#2563eb' }}
                        >
                          {user.organizationWebsite}
                        </a>
                      </div>
                    )}
                    <div>
                      <span className="font-medium" style={{ color: '#1f2937' }}>User ID:</span>{' '}
                      <span className="font-mono text-xs" style={{ color: '#6b7280' }}>
                        {user.userId}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: '#1f2937' }}>Org ID:</span>{' '}
                      <span className="font-mono text-xs" style={{ color: '#6b7280' }}>
                        {user.organizationId}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: '#1f2937' }}>Created:</span>{' '}
                      <span style={{ color: '#6b7280' }}>
                        {new Date(user.userCreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

