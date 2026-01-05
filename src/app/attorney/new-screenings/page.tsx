import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { screenings, users } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FileText, Clock } from "lucide-react";

export default async function NewScreeningsPage() {
  await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
  const session = await auth();
  const attorneyId = session?.user?.id;

  // Fetch new/assigned screenings (not yet in progress, excluding test screenings)
  const newScreenings = await db
    .select({
      id: screenings.id,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      status: screenings.status,
      createdAt: screenings.createdAt,
      updatedAt: screenings.updatedAt,
      clientName: users.name,
      clientEmail: users.email,
      clientId: users.id,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.userId))
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        eq(screenings.isTestMode, false), // Exclude test screenings
        or(
          eq(screenings.status, 'assigned'),
          eq(screenings.status, 'submitted')
        )
      )
    )
    .orderBy(desc(screenings.createdAt));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <div className="container mx-auto p-6 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/attorney">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            New Screenings
          </h1>
          <p className="text-muted-foreground">
            Recently assigned screenings awaiting your review
          </p>
        </div>

        {/* Screenings List */}
        <Card className="p-6 bg-white">
          {newScreenings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No new screenings</p>
              <p className="text-sm">New screenings assigned to you will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 text-sm text-muted-foreground">
                {newScreenings.length} screening{newScreenings.length !== 1 ? 's' : ''}
              </div>
              {newScreenings.map((screening) => (
                <Card key={screening.id} className="p-4 hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-lg truncate">{screening.flowName}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(screening.status)}`}>
                          {screening.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                            {screening.clientName?.charAt(0) || screening.clientEmail?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{screening.clientName || screening.clientEmail}</span>
                        </div>
                        <span suppressHydrationWarning>
                          Submitted {new Date(screening.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <Link href={`/attorney/screenings/${screening.id}`}>
                      <Button size="sm" className="whitespace-nowrap">
                        Review
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

