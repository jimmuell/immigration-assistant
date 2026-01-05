"use server";

import { db } from "@/lib/db";
import { screenings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function getScreeningById(id: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const [screening] = await db
    .select()
    .from(screenings)
    .where(
      and(
        eq(screenings.id, id),
        eq(screenings.userId, session.user.id)
      )
    )
    .limit(1);
  
  return screening || null;
}
