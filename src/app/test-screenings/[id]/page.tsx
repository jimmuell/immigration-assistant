import { db } from "@/lib/db";
import { screenings, users, attorneyClientMessages, screeningDocuments, quoteRequests } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import TestScreeningDetailClient from "./test-screening-detail-client";
import { requireRole } from "@/lib/role-middleware";

interface TestScreeningDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TestScreeningDetailPage({ params }: TestScreeningDetailPageProps) {
  const { id } = await params;
  await requireRole(['org_admin', 'staff', 'super_admin']);
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const [screening] = await db
    .select({
      id: screenings.id,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      responses: screenings.responses,
      status: screenings.status,
      isTestMode: screenings.isTestMode,
      isLocked: screenings.isLocked,
      submittedForReviewAt: screenings.submittedForReviewAt,
      createdAt: screenings.createdAt,
      updatedAt: screenings.updatedAt,
      userId: screenings.userId,
      assignedAttorneyId: screenings.assignedAttorneyId,
      attorneyName: users.name,
      attorneyEmail: users.email,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.assignedAttorneyId))
    .where(
      and(
        eq(screenings.id, id),
        eq(screenings.isTestMode, true) // Only show test screenings
      )
    )
    .limit(1);

  if (!screening) {
    notFound();
  }

  // Fetch messages (can exist even if quote not accepted yet)
  const messages = await db
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
    .orderBy(attorneyClientMessages.createdAt);

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
  const [quote] = await db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.screeningId, id))
    .orderBy(desc(quoteRequests.createdAt))
    .limit(1);

  return (
    <TestScreeningDetailClient 
      screening={screening}
      messages={messages}
      documents={documents}
      quote={quote || null}
      userId={session.user.id}
    />
  );
}
