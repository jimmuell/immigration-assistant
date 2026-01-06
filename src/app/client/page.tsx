import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flows, screenings } from "@/lib/db/schema";
import { eq, and, count, desc, ne } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, Clock, CheckCircle, DollarSign } from "lucide-react";
import { ClientMobileNav } from "@/components/client-mobile-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCard } from "@/components/dashboard/stats-card";

export default async function ClientDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get all active flows (global flows visible to all clients)
  // Note: organizationId is reserved for future org-specific flows
  const activeFlows = await db
    .select()
    .from(flows)
    .where(eq(flows.isActive, true))
    .orderBy(flows.createdAt);

  // Get client stats
  const [completedCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(and(
      eq(screenings.userId, userId),
      eq(screenings.isTestMode, false)
    ));

  const [inReviewCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(and(
      eq(screenings.userId, userId),
      eq(screenings.status, 'submitted'),
      eq(screenings.isTestMode, false)
    ));

  const [quotedCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(and(
      eq(screenings.userId, userId),
      eq(screenings.status, 'quoted'),
      eq(screenings.isTestMode, false)
    ));

  const [draftCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(and(
      eq(screenings.userId, userId),
      eq(screenings.status, 'draft'),
      eq(screenings.isTestMode, false)
    ));

  // Get in-progress (draft) screenings
  const inProgressScreenings = await db
    .select()
    .from(screenings)
    .where(and(
      eq(screenings.userId, userId),
      eq(screenings.status, 'draft'),
      eq(screenings.isTestMode, false)
    ))
    .orderBy(desc(screenings.updatedAt))
    .limit(3);

  // Get recent completed screenings (non-draft)
  const recentScreenings = await db
    .select()
    .from(screenings)
    .where(and(
      eq(screenings.userId, userId),
      ne(screenings.status, 'draft'),
      eq(screenings.isTestMode, false)
    ))
    .orderBy(desc(screenings.updatedAt))
    .limit(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <ClientMobileNav />
      <div className="container mx-auto p-6 md:pt-8 space-y-8">
        <DashboardHeader userName={session.user.name?.split(' ')[0]} />

        {/* Stats Cards - 4 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Submissions"
            value={completedCount?.count || 0}
            period="All Time"
            icon={<FileText className="h-5 w-5" />}
          />
          <StatsCard
            title="In Review"
            value={inReviewCount?.count || 0}
            period="Pending"
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            title="Quotes Received"
            value={quotedCount?.count || 0}
            period="Awaiting Response"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatsCard
            title="Drafts Saved"
            value={draftCount?.count || 0}
            period="In Progress"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        {/* In Progress Screenings */}
        {inProgressScreenings.length > 0 && (
          <Card className="p-6 bg-white border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Continue Your Screenings
              </h2>
              <Link href="/saved">
                <Button variant="ghost" size="sm">View All Drafts</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {inProgressScreenings.map((screening) => (
                <Card key={screening.id} className="p-4 hover:shadow-md transition-shadow border border-orange-200 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{screening.flowName}</h3>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                          In Progress
                        </span>
                      </div>
                      <p className="text-sm text-gray-600" suppressHydrationWarning>
                        Last updated {new Date(screening.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/flow/${screening.flowId}`}>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        Continue
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        {recentScreenings.length > 0 && (
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Recent Activity
              </h2>
              <Link href="/completed">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentScreenings.map((screening) => (
                <Card key={screening.id} className="p-4 hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{screening.flowName}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          screening.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          screening.status === 'quoted' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {screening.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600" suppressHydrationWarning>
                        Updated {new Date(screening.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/completed/${screening.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Available Screenings */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-semibold mb-6">
            Available Immigration Screenings
          </h2>
          
          {activeFlows.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Screenings Available Yet
              </h3>
              <p className="text-sm text-gray-600">
                Our team is preparing immigration screenings for you. Please check back soon!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeFlows.map((flow) => (
                <Card 
                  key={flow.id} 
                  className="hover:border-blue-500 hover:shadow-md transition-all duration-200"
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-gray-900 mb-1">
                          {flow.name}
                        </CardTitle>
                        {flow.description && (
                          <CardDescription className="text-xs text-gray-600">
                            {flow.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/flow/${flow.id}`}>
                      <Button 
                        className="w-full"
                        size="sm"
                      >
                        Start Screening
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Help Section */}
        <Card className="bg-blue-50 p-6 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Need Help?</h3>
              <p className="mt-1 text-sm text-blue-700">
                Complete any of the screenings above to get started with your immigration process. 
                Once submitted, our attorneys will review your information and provide personalized guidance.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

