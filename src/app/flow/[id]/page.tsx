import { db } from "@/lib/db";
import { flows, screenings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import FlowClient from "./flow-client";
import { auth } from "@/lib/auth";

interface FlowPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FlowPage({ params }: FlowPageProps) {
  const { id } = await params;
  const session = await auth();
  
  const [flow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  if (!flow) {
    notFound();
  }

  // Only show active flows to clients
  if (!flow.isActive) {
    notFound();
  }

  // Check if user has a saved draft for this flow
  let savedScreening = null;
  if (session?.user?.id) {
    const [draft] = await db
      .select()
      .from(screenings)
      .where(
        and(
          eq(screenings.userId, session.user.id),
          eq(screenings.flowId, id),
          eq(screenings.status, 'draft')
        )
      )
      .orderBy(screenings.updatedAt)
      .limit(1);
    
    if (draft) {
      savedScreening = draft;
    }
  }

  return <FlowClient flow={flow} savedScreening={savedScreening} userRole={session?.user?.role || 'client'} />;
}
