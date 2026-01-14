"use server";

import { db } from "@/lib/db";
import { attorneyClientMessages, quoteRequests, screenings } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/role-middleware";
import { revalidatePath } from "next/cache";

export async function sendMessage({
  screeningId,
  senderId,
  receiverId,
  content,
}: {
  screeningId: string;
  senderId: string;
  receiverId: string;
  content: string;
}) {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin', 'client']);

    const [message] = await db
      .insert(attorneyClientMessages)
      .values({
        screeningId,
        senderId,
        receiverId,
        content,
        isRead: false,
      })
      .returning();

    revalidatePath(`/attorney/screenings/${screeningId}`);
    revalidatePath(`/screenings/${screeningId}`);

    return { success: true, message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function markMessagesAsRead(messageIds: string[]) {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin', 'client']);

    await db
      .update(attorneyClientMessages)
      .set({ isRead: true })
      .where(inArray(attorneyClientMessages.id, messageIds));

    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}

export async function submitQuote({
  screeningId,
  amount,
  description,
  notes,
  expiresAt,
}: {
  screeningId: string;
  amount: number;
  description: string | null;
  notes: string | null;
  expiresAt: Date | null;
}) {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);

    const session = await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
    const attorneyId = session.user.id;
    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return { success: false, error: 'Attorney must belong to an organization' };
    }

    // Create quote
    await db.insert(quoteRequests).values({
      screeningId,
      attorneyId,
      organizationId,
      amount,
      description,
      notes,
      expiresAt,
      status: 'pending',
    });

    // Update screening status to quoted
    await db
      .update(screenings)
      .set({ 
        status: 'quoted',
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    revalidatePath(`/attorney/screenings/${screeningId}`);
    revalidatePath(`/screenings/${screeningId}`);
    revalidatePath('/attorney');
    revalidatePath('/attorney/quotes');
    revalidatePath('/my-quotes');

    return { success: true };
  } catch (error) {
    console.error('Error submitting quote:', error);
    return { success: false, error: 'Failed to submit quote' };
  }
}
