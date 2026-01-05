import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { screenings, users, quoteRequests } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckSquare, CheckCircle } from "lucide-react";

export default async function AcceptedQuotesPage() {
  await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
  const session = await auth();
  const attorneyId = session?.user?.id;

  // Fetch screenings with accepted quotes (excluding test screenings)
  const acceptedQuotes = await db
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
      quoteCreatedAt: quoteRequests.createdAt,
      quoteCurrency: quoteRequests.currency,
      quoteUpdatedAt: quoteRequests.updatedAt,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.userId))
    .innerJoin(quoteRequests, eq(quoteRequests.screeningId, screenings.id))
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        eq(quoteRequests.status, 'accepted'),
        eq(screenings.status, 'quote_accepted'),
        eq(screenings.isTestMode, false) // Exclude test screenings
      )
    )
    .orderBy(desc(quoteRequests.updatedAt));

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
            <CheckSquare className="h-8 w-8 text-green-600" />
            Accepted Quotes
          </h1>
          <p className="text-muted-foreground">
            Quotes that have been accepted by clients and are ready to begin
          </p>
        </div>

        {/* Quotes List */}
        <Card className="p-6 bg-white">
          {acceptedQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No accepted quotes</p>
              <p className="text-sm">Quotes accepted by clients will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 text-sm text-muted-foreground">
                {acceptedQuotes.length} accepted quote{acceptedQuotes.length !== 1 ? 's' : ''}
              </div>
              {acceptedQuotes.map((quote) => (
                <Card key={quote.id} className="p-4 hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <h3 className="font-semibold text-lg truncate">{quote.flowName}</h3>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-green-100 text-green-700">
                          {quote.quoteCurrency} {quote.quoteAmount?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                            {quote.clientName?.charAt(0) || quote.clientEmail?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{quote.clientName || quote.clientEmail}</span>
                        </div>
                        <span suppressHydrationWarning>
                          Accepted {new Date(quote.quoteUpdatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <Link href={`/attorney/screenings/${quote.id}`}>
                      <Button size="sm" className="whitespace-nowrap">
                        View Case
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

