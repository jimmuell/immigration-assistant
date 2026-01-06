"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { screenings, quoteRequests, attorneyProfiles, organizations, notificationStates } from "@/lib/db/schema";
import { eq, and, isNull, or, desc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface Notification {
  id: string;
  type: 'new_screening' | 'quote_received' | 'pending_quote' | 'quote_accepted' | 'quote_declined' | 'needs_assignment';
  title: string;
  message: string;
  link: string;
  createdAt: Date;
  icon: 'screening' | 'quote' | 'check' | 'x' | 'alert';
  isRead: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth();
  
  if (!session?.user) {
    return [];
  }

  const userRole = session.user.role;
  const userId = session.user.id;
  const notifications: Notification[] = [];

  // CLIENT NOTIFICATIONS
  if (userRole === 'client') {
    // 1. Quotes Received (pending quotes)
    const quotedScreenings = await db
      .select({
        screeningId: screenings.id,
        flowName: screenings.flowName,
        amount: quoteRequests.amount,
        currency: quoteRequests.currency,
        createdAt: quoteRequests.createdAt,
      })
      .from(screenings)
      .innerJoin(quoteRequests, eq(quoteRequests.screeningId, screenings.id))
      .where(
        and(
          eq(screenings.userId, userId),
          eq(quoteRequests.status, 'pending'),
          eq(screenings.status, 'quoted'),
          eq(screenings.isTestMode, false)
        )
      )
      .orderBy(desc(quoteRequests.createdAt))
      .limit(5);

    quotedScreenings.forEach(screening => {
      notifications.push({
        id: `quote-${screening.screeningId}`,
        type: 'quote_received',
        title: 'New Quote Received',
        message: `${screening.flowName}: ${screening.currency} ${screening.amount.toFixed(2)}`,
        link: `/completed/${screening.screeningId}`,
        createdAt: screening.createdAt,
        icon: 'quote',
      });
    });

    // 2. Screenings In Review
    const inReviewScreenings = await db
      .select({
        id: screenings.id,
        flowName: screenings.flowName,
        submittedAt: screenings.submittedForReviewAt,
      })
      .from(screenings)
      .where(
        and(
          eq(screenings.userId, userId),
          or(
            eq(screenings.status, 'submitted'),
            eq(screenings.status, 'assigned')
          ),
          eq(screenings.isLocked, true),
          eq(screenings.isTestMode, false)
        )
      )
      .orderBy(desc(screenings.submittedForReviewAt))
      .limit(3);

    inReviewScreenings.forEach(screening => {
      notifications.push({
        id: `review-${screening.id}`,
        type: 'new_screening',
        title: 'Screening Under Review',
        message: `${screening.flowName} is being reviewed by our team`,
        link: `/completed/${screening.id}`,
        createdAt: screening.submittedAt || new Date(),
        icon: 'screening',
      });
    });
  }

  // ATTORNEY NOTIFICATIONS
  if (userRole === 'attorney' || userRole === 'org_admin') {
    // Check if user has attorney profile
    const [attorneyProfile] = await db
      .select()
      .from(attorneyProfiles)
      .where(eq(attorneyProfiles.userId, userId))
      .limit(1);

    if (attorneyProfile) {
      // Get organization settings
      let requireStaffPreScreening = false;
      if (session.user.organizationId) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, session.user.organizationId))
          .limit(1);
        
        requireStaffPreScreening = org?.requireStaffPreScreening || false;
      }

      // 1. New Screenings to Review
      const assignmentCondition = !requireStaffPreScreening
        ? isNull(screenings.assignedAttorneyId) // Marketplace: all unassigned
        : eq(screenings.reviewedForAttorneyId, userId); // Gatekeeper: assigned to me

      const newScreenings = await db
        .select({
          id: screenings.id,
          flowName: screenings.flowName,
          createdAt: screenings.createdAt,
        })
        .from(screenings)
        .where(
          and(
            eq(screenings.isTestMode, false),
            or(
              eq(screenings.status, 'submitted'),
              eq(screenings.status, 'assigned')
            ),
            assignmentCondition
          )
        )
        .orderBy(desc(screenings.createdAt))
        .limit(5);

      newScreenings.forEach(screening => {
        notifications.push({
          id: `new-screening-${screening.id}`,
          type: 'new_screening',
          title: 'New Screening Available',
          message: `${screening.flowName} - Ready for review`,
          link: `/attorney/screenings/${screening.id}`,
          createdAt: screening.createdAt,
          icon: 'screening',
        });
      });

      // 2. Pending Quotes (awaiting client response)
      const pendingQuotes = await db
        .select({
          screeningId: screenings.id,
          flowName: screenings.flowName,
          amount: quoteRequests.amount,
          createdAt: quoteRequests.createdAt,
        })
        .from(quoteRequests)
        .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
        .where(
          and(
            eq(quoteRequests.attorneyId, userId),
            eq(quoteRequests.status, 'pending'),
            eq(screenings.isTestMode, false)
          )
        )
        .orderBy(desc(quoteRequests.createdAt))
        .limit(3);

      pendingQuotes.forEach(quote => {
        notifications.push({
          id: `pending-quote-${quote.screeningId}`,
          type: 'pending_quote',
          title: 'Quote Awaiting Response',
          message: `${quote.flowName} - $${quote.amount.toFixed(2)} pending`,
          link: `/attorney/screenings/${quote.screeningId}`,
          createdAt: quote.createdAt,
          icon: 'quote',
        });
      });

      // 3. Accepted Quotes
      const acceptedQuotes = await db
        .select({
          screeningId: screenings.id,
          flowName: screenings.flowName,
          amount: quoteRequests.amount,
          updatedAt: quoteRequests.updatedAt,
        })
        .from(quoteRequests)
        .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
        .where(
          and(
            eq(quoteRequests.attorneyId, userId),
            eq(quoteRequests.status, 'accepted'),
            eq(screenings.isTestMode, false)
          )
        )
        .orderBy(desc(quoteRequests.updatedAt))
        .limit(2);

      acceptedQuotes.forEach(quote => {
        notifications.push({
          id: `accepted-${quote.screeningId}`,
          type: 'quote_accepted',
          title: 'Quote Accepted! 🎉',
          message: `${quote.flowName} - Client accepted your quote`,
          link: `/attorney/cases`,
          createdAt: quote.updatedAt || new Date(),
          icon: 'check',
        });
      });
    }
  }

  // STAFF/ADMIN NOTIFICATIONS (in gatekeeper mode)
  if (userRole === 'staff' || userRole === 'org_admin' || userRole === 'super_admin') {
    // Check if organization has gatekeeper mode enabled
    let requireStaffPreScreening = false;
    if (session.user.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, session.user.organizationId))
        .limit(1);
      
      requireStaffPreScreening = org?.requireStaffPreScreening || false;
    }

    if (requireStaffPreScreening) {
      // Screenings needing staff assignment
      const unassignedScreenings = await db
        .select({
          id: screenings.id,
          flowName: screenings.flowName,
          createdAt: screenings.createdAt,
        })
        .from(screenings)
        .where(
          and(
            eq(screenings.isTestMode, false),
            or(
              eq(screenings.status, 'submitted'),
              eq(screenings.status, 'assigned')
            ),
            isNull(screenings.reviewedForAttorneyId) // Not yet assigned by staff
          )
        )
        .orderBy(desc(screenings.createdAt))
        .limit(5);

      unassignedScreenings.forEach(screening => {
        notifications.push({
          id: `needs-assignment-${screening.id}`,
          type: 'needs_assignment',
          title: 'Screening Needs Assignment',
          message: `${screening.flowName} - Assign to attorney`,
          link: `/admin/intakes`,
          createdAt: screening.createdAt,
          icon: 'alert',
        });
      });
    }
  }

  // Fetch notification states for this user
  const notificationIds = notifications.map(n => n.id);
  const states = await db
    .select()
    .from(notificationStates)
    .where(
      and(
        eq(notificationStates.userId, userId),
        eq(notificationStates.isDismissed, false)
      )
    );

  // Create a map of notification states
  const stateMap = new Map(states.map(s => [s.notificationId, s]));

  // Add read state to notifications and filter out dismissed ones
  const notificationsWithState = notifications
    .filter(n => {
      const state = stateMap.get(n.id);
      return !state || !state.isDismissed;
    })
    .map(n => ({
      ...n,
      isRead: stateMap.get(n.id)?.isRead || false,
    }));

  // Sort all notifications by date (most recent first)
  notificationsWithState.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return notificationsWithState.slice(0, 10); // Return top 10
}

export async function getNotificationCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.isRead).length; // Only count unread
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false };
    }

    // Check if exists
    const [existing] = await db
      .select()
      .from(notificationStates)
      .where(
        and(
          eq(notificationStates.userId, session.user.id),
          eq(notificationStates.notificationId, notificationId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing
      await db
        .update(notificationStates)
        .set({
          isRead: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notificationStates.userId, session.user.id),
            eq(notificationStates.notificationId, notificationId)
          )
        );
    } else {
      // Insert new
      await db
        .insert(notificationStates)
        .values({
          userId: session.user.id,
          notificationId,
          isRead: true,
          isDismissed: false,
        });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }
}

export async function markNotificationAsUnread(notificationId: string): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false };
    }

    // Check if exists
    const [existing] = await db
      .select()
      .from(notificationStates)
      .where(
        and(
          eq(notificationStates.userId, session.user.id),
          eq(notificationStates.notificationId, notificationId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing
      await db
        .update(notificationStates)
        .set({
          isRead: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notificationStates.userId, session.user.id),
            eq(notificationStates.notificationId, notificationId)
          )
        );
    } else {
      // Insert new
      await db
        .insert(notificationStates)
        .values({
          userId: session.user.id,
          notificationId,
          isRead: false,
          isDismissed: false,
        });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    return { success: false };
  }
}

export async function dismissNotification(notificationId: string): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false };
    }

    // Check if exists
    const [existing] = await db
      .select()
      .from(notificationStates)
      .where(
        and(
          eq(notificationStates.userId, session.user.id),
          eq(notificationStates.notificationId, notificationId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing
      await db
        .update(notificationStates)
        .set({
          isDismissed: true,
          isRead: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notificationStates.userId, session.user.id),
            eq(notificationStates.notificationId, notificationId)
          )
        );
    } else {
      // Insert new
      await db
        .insert(notificationStates)
        .values({
          userId: session.user.id,
          notificationId,
          isRead: true,
          isDismissed: true,
        });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return { success: false };
  }
}

