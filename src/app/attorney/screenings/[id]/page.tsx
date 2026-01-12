import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { screenings, users, attorneyClientMessages, screeningDocuments, quoteRequests, screeningViews, organizations, attorneyProfiles } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import ScreeningDetailClient from "./screening-detail-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AttorneyScreeningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
  const session = await auth();
  const attorneyId = session?.user?.id;
  const userRole = session?.user?.role;

  const { id } = await params;

  // Fetch screening with client info
  const screeningResults = await db
    .select({
      id: screenings.id,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      responses: screenings.responses,
      status: screenings.status,
      createdAt: screenings.createdAt,
      updatedAt: screenings.updatedAt,
      clientId: screenings.userId,
      clientName: users.name,
      clientEmail: users.email,
      clientAnonymizedName: users.anonymizedDisplayName,
      assignedAttorneyId: screenings.assignedAttorneyId,
      reviewedForAttorneyId: screenings.reviewedForAttorneyId,
      organizationId: screenings.organizationId,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.userId))
    .where(eq(screenings.id, id));

  const screening = screeningResults[0];

  if (!screening) {
    notFound();
  }

  // Check if user has an attorney profile
  const [attorneyProfile] = await db
    .select()
    .from(attorneyProfiles)
    .where(eq(attorneyProfiles.userId, attorneyId!))
    .limit(1);

  // Get organization settings
  let requireStaffPreScreening = false;
  if (session?.user?.organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.user.organizationId))
      .limit(1);
    
    requireStaffPreScreening = org?.requireStaffPreScreening || false;
  }

  // Determine if this is pure staff or super admin (full access)
  const isPureStaff = userRole === 'staff' || (userRole === 'org_admin' && !attorneyProfile);
  const isSuperAdmin = userRole === 'super_admin';
  const hasAdminAccess = isPureStaff || isSuperAdmin;

  // Access control logic:
  // 1. Admins and staff can see all screenings
  // 2. Attorneys can see screenings if:
  //    a. They are assigned to it (assignedAttorneyId === attorneyId)
  //    b. It's reviewed for them in gatekeeper mode (reviewedForAttorneyId === attorneyId)
  //    c. It's unassigned and in marketplace mode (assignedAttorneyId is NULL and !requireStaffPreScreening)
  if (!hasAdminAccess) {
    const isAssignedToMe = screening.assignedAttorneyId === attorneyId;
    const isReviewedForMe = screening.reviewedForAttorneyId === attorneyId;
    const isAvailableInMarketplace = !screening.assignedAttorneyId && !requireStaffPreScreening;
    
    if (!isAssignedToMe && !isReviewedForMe && !isAvailableInMarketplace) {
      redirect('/attorney');
    }
  }

  // Mark screening as viewed by this attorney
  const existingView = await db
    .select()
    .from(screeningViews)
    .where(
      and(
        eq(screeningViews.screeningId, id),
        eq(screeningViews.attorneyId, attorneyId!)
      )
    )
    .limit(1);

  if (existingView.length === 0) {
    await db.insert(screeningViews).values({
      screeningId: id,
      attorneyId: attorneyId!,
    });
  }

  // Fetch messages
  const messages = screening.assignedAttorneyId ? await db
    .select({
      id: attorneyClientMessages.id,
      content: attorneyClientMessages.content,
      senderId: attorneyClientMessages.senderId,
      receiverId: attorneyClientMessages.receiverId,
      isRead: attorneyClientMessages.isRead,
      createdAt: attorneyClientMessages.createdAt,
      senderName: users.name,
      senderEmail: users.email,
    })
    .from(attorneyClientMessages)
    .leftJoin(users, eq(users.id, attorneyClientMessages.senderId))
    .where(eq(attorneyClientMessages.screeningId, id))
    .orderBy(attorneyClientMessages.createdAt) : [];

  // Fetch documents
  const documents = await db
    .select({
      id: screeningDocuments.id,
      fileName: screeningDocuments.fileName,
      fileType: screeningDocuments.fileType,
      fileSize: screeningDocuments.fileSize,
      fileUrl: screeningDocuments.fileUrl,
      documentType: screeningDocuments.documentType,
      description: screeningDocuments.description,
      createdAt: screeningDocuments.createdAt,
      uploadedBy: screeningDocuments.uploadedBy,
      uploaderName: users.name,
      uploaderEmail: users.email,
    })
    .from(screeningDocuments)
    .leftJoin(users, eq(users.id, screeningDocuments.uploadedBy))
    .where(eq(screeningDocuments.screeningId, id))
    .orderBy(desc(screeningDocuments.createdAt));

  // Fetch quote (if exists)
  const quoteResults = await db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.screeningId, id))
    .orderBy(desc(quoteRequests.createdAt))
    .limit(1);

  const quote = quoteResults[0] || null;

  // Determine client display name based on contact unlock status
  const isContactUnlocked = quote?.isContactUnlocked || false;
  const clientDisplayName = isContactUnlocked
    ? screening.clientName || 'Client'
    : screening.clientAnonymizedName || `Client #${screening.clientId.substring(0, 4).toUpperCase()}`;

  // Parse responses
  const responses = JSON.parse(screening.responses) as Array<{
    question: string;
    answer: string;
  }>;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
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

        {/* Screening Overview */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{screening.flowName}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Submission ID: <code className="text-xs">{screening.submissionId}</code></span>
                <span>•</span>
                <span suppressHydrationWarning>
                  Submitted {new Date(screening.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                {screening.clientName?.charAt(0) || screening.clientEmail?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{screening.clientName || 'Client'}</p>
                <p className="text-sm text-muted-foreground">{screening.clientEmail}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabbed Interface */}
        <ScreeningDetailClient
          screeningId={id}
          clientId={screening.clientId}
          clientName={clientDisplayName}
          attorneyId={attorneyId!}
          responses={responses}
          messages={messages}
          documents={documents}
          quote={quote}
          status={screening.status}
        />
      </div>
    </div>
  );
}
