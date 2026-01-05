"use server";

import { db } from "@/lib/db";
import { flows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function createFlow(data: {
  name: string;
  description?: string;
  content: string;
}) {
  const session = await auth();
  
  // Only super admins can create flows
  if (!session || session.user.role !== 'super_admin') {
    throw new Error('Unauthorized: Flow management requires Super Admin role');
  }

  const [flow] = await db.insert(flows).values({
    name: data.name,
    description: data.description || '',
    content: data.content,
    isActive: false,
  }).returning();

  revalidatePath('/admin/flows');
  return flow;
}

export async function updateFlow(id: string, data: {
  name?: string;
  description?: string;
  content?: string;
  isActive?: boolean;
}) {
  const session = await auth();
  
  // Only super admins can update flows
  if (!session || session.user.role !== 'super_admin') {
    throw new Error('Unauthorized: Flow management requires Super Admin role');
  }

  const [flow] = await db
    .update(flows)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(flows.id, id))
    .returning();

  revalidatePath('/admin/flows');
  return flow;
}

export async function deleteFlow(id: string) {
  const session = await auth();
  
  // Only super admins can delete flows
  if (!session || session.user.role !== 'super_admin') {
    throw new Error('Unauthorized: Flow management requires Super Admin role');
  }

  await db.delete(flows).where(eq(flows.id, id));
  revalidatePath('/admin/flows');
}

export async function toggleFlowActive(id: string) {
  const session = await auth();
  
  // Only super admins can toggle flow active status
  if (!session || session.user.role !== 'super_admin') {
    throw new Error('Unauthorized: Flow management requires Super Admin role');
  }

  // Get current state
  const [currentFlow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  if (!currentFlow) {
    throw new Error('Flow not found');
  }

  // Toggle the active state
  const [updatedFlow] = await db
    .update(flows)
    .set({
      isActive: !currentFlow.isActive,
      updatedAt: new Date(),
    })
    .where(eq(flows.id, id))
    .returning();

  revalidatePath('/admin/flows');
  return updatedFlow;
}

export async function getFlows() {
  const session = await auth();
  
  if (!session || (!['org_admin', 'staff', 'super_admin'].includes(session.user.role))) {
    throw new Error('Unauthorized');
  }

  const allFlows = await db.select().from(flows).orderBy(flows.createdAt);
  return allFlows;
}

export async function getFlowById(id: string) {
  const session = await auth();
  
  if (!session || (!['org_admin', 'staff', 'super_admin'].includes(session.user.role))) {
    throw new Error('Unauthorized');
  }

  const [flow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  return flow || null;
}
