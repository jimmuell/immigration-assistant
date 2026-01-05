"use server";

import { db } from "@/lib/db";
import { flows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get all active flows for display on the client home page
 * No authentication required - these are publicly visible options
 */
export async function getActiveFlows() {
  const activeFlows = await db
    .select()
    .from(flows)
    .where(eq(flows.isActive, true))
    .orderBy(flows.createdAt);
  
  return activeFlows;
}
