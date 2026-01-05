import { db } from "@/lib/db";
import { screenings, users, attorneyClientMessages, screeningDocuments, quoteRequests } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import ScreeningDetailClient from "./screening-detail-client";

interface ScreeningDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ScreeningDetailPage({ params }: ScreeningDetailPageProps) {
  const { id } = await params;
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
        eq(screenings.userId, session.user.id)
      )
    )
    .limit(1);

  if (!screening) {
    notFound();
  }

  // Fetch messages if attorney is assigned
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
  const [quote] = screening.assignedAttorneyId ? await db
    .select()
    .from(quoteRequests)
    .where(eq(quoteRequests.screeningId, id))
    .orderBy(desc(quoteRequests.createdAt))
    .limit(1) : [null];

  return (
    <ScreeningDetailClient 
      screening={screening}
      messages={messages}
      documents={documents}
      quote={quote || null}
      clientId={session.user.id}
    />
  );
}
