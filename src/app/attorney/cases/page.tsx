import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { screenings, users, quoteRequests } from "@/lib/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Briefcase, Clock, CheckCircle } from "lucide-react";

export default async function CasesPage() {
  await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
  const session = await auth();
  const attorneyId = session?.user?.id;

  // Fetch all active cases (quote accepted or in progress, excluding test screenings)
  const cases = await db
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
      quoteId: quoteRequests.id,
      quoteAmount: quoteRequests.amount,
      quoteCurrency: quoteRequests.currency,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.userId))
    .leftJoin(quoteRequests, and(
      eq(quoteRequests.screeningId, screenings.id),
      eq(quoteRequests.status, 'accepted')
    ))
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        eq(screenings.isTestMode, false), // Exclude test screenings
        or(
          eq(screenings.status, 'quote_accepted'),
          eq(screenings.status, 'in_progress')
        )
      )
    )
    .orderBy(desc(screenings.updatedAt));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote_accepted':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'quote_accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Briefcase className="h-4 w-4" />;
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
            <Briefcase className="h-8 w-8 text-blue-600" />
            Active Cases
          </h1>
          <p className="text-muted-foreground">
            All active cases with accepted quotes
          </p>
        </div>

        {/* Cases List */}
        <Card className="p-6 bg-white">
          {cases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No active cases</p>
              <p className="text-sm">Cases with accepted quotes will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 text-sm text-muted-foreground">
                {cases.length} active case{cases.length !== 1 ? 's' : ''}
              </div>
              {cases.map((caseItem) => (
                <Card key={caseItem.id} className="p-4 hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(caseItem.status)}
                        <h3 className="font-semibold text-lg truncate">{caseItem.flowName}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status.replace('_', ' ')}
                        </span>
                        {caseItem.quoteAmount && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
                            {caseItem.quoteCurrency} {caseItem.quoteAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                            {caseItem.clientName?.charAt(0) || caseItem.clientEmail?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{caseItem.clientName || caseItem.clientEmail}</span>
                        </div>
                        <span suppressHydrationWarning>
                          Updated {new Date(caseItem.updatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <Link href={`/attorney/screenings/${caseItem.id}`}>
                      <Button size="sm" className="whitespace-nowrap">
                        Manage Case
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

