"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingDisplay } from "@/components/attorney/rating-display";
import { TeamTabContent } from "@/components/admin/team-tab-content";
import Link from "next/link";
import { UserPlus, Plus } from "lucide-react";

type AttorneyProfile = {
  yearsOfExperience?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
  specialties?: string[] | null;
};

type Attorney = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  profile: AttorneyProfile | null;
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
};

interface UsersClientProps {
  attorneys: Attorney[];
  clients: User[];
  admins: User[];
  staff: User[];
}

export function UsersClient({ attorneys, clients, admins, staff }: UsersClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') || 'attorneys';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full max-w-2xl grid-cols-4">
        <TabsTrigger value="attorneys">Attorneys ({attorneys.length})</TabsTrigger>
        <TabsTrigger value="team">Team ({staff.length})</TabsTrigger>
        <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
        <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
      </TabsList>

      {/* Attorneys Tab */}
      <TabsContent value="attorneys">
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Attorneys</h2>
            <Button 
              onClick={() => router.push("/admin/attorneys/add")}
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Attorney
            </Button>
          </div>

          {attorneys.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No attorneys yet</p>
              <Button onClick={() => router.push("/admin/attorneys/add")}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Attorney
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attorneys.map((attorney) => (
                <Link key={attorney.id} href={`/admin/attorneys/${attorney.id}`}>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium text-lg shrink-0">
                        {attorney.name?.charAt(0) || attorney.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{attorney.name || 'No name'}</h3>
                        <p className="text-sm text-gray-600 truncate">{attorney.email}</p>
                        {attorney.profile && (
                          <>
                            {attorney.profile.yearsOfExperience && (
                              <p className="text-sm text-gray-600 mt-1">
                                {attorney.profile.yearsOfExperience} years experience
                              </p>
                            )}
                            <div className="mt-2">
                              <RatingDisplay
                                rating={attorney.profile.rating ?? 0}
                                ratingCount={attorney.profile.ratingCount ?? 0}
                                size="sm"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {attorney.profile?.specialties && attorney.profile.specialties.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {attorney.profile.specialties.slice(0, 2).map((specialty: string) => (
                          <span
                            key={specialty}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                        {attorney.profile.specialties.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            +{attorney.profile.specialties.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </TabsContent>

      {/* Team Tab */}
      <TabsContent value="team">
        <Card className="p-6 bg-white">
          <TeamTabContent />
        </Card>
      </TabsContent>

      {/* Clients Tab */}
      <TabsContent value="clients">
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-semibold mb-6">Clients</h2>
          {clients.length === 0 ? (
            <p className="text-center py-12 text-gray-600">No clients yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{client.name || 'N/A'}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{client.email}</td>
                      <td className="py-4 px-4 text-sm text-gray-600" suppressHydrationWarning>
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </TabsContent>

      {/* Admins Tab */}
      <TabsContent value="admins">
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-semibold mb-6">Administrators</h2>
          <p className="text-sm text-gray-600 mb-4">
            Users with administrative access (practice owners and staff)
          </p>
          {admins.length === 0 ? (
            <p className="text-center py-12 text-gray-600">No administrators</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{admin.name || 'N/A'}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{admin.email}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{admin.role}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          admin.role === 'org_admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {admin.role === 'org_admin' ? 'Owner' : 'Staff'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600" suppressHydrationWarning>
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
}

