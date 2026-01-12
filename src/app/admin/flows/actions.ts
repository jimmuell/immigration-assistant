"use server";

import { db } from "@/lib/db";
import { flows } from "@/lib/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function createFlow(data: {
  name: string;
  description?: string;
  content: string;
}) {
  const session = await auth();
  
  // Org admins and super admins can create flows
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
  }

  // Org admins can only create flows for their organization
  const organizationId = session.user.role === 'super_admin' 
    ? null // Super admin creates global flows
    : session.user.organizationId; // Org admin creates org-specific flows

  if (session.user.role === 'org_admin' && !organizationId) {
    throw new Error('Organization admins must be associated with an organization');
  }

  const [flow] = await db.insert(flows).values({
    name: data.name,
    description: data.description || '',
    content: data.content,
    organizationId,
    isActive: false,
    isDraft: true, // New flows start as drafts
  }).returning();

  revalidatePath('/admin/flows');
  return flow;
}

export async function updateFlow(id: string, data: {
  name?: string;
  description?: string;
  content?: string;
  isActive?: boolean;
  isDraft?: boolean;
}) {
  const session = await auth();
  
  // Org admins and super admins can update flows
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
  }

  // Get the flow to check ownership
  const [existingFlow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  if (!existingFlow) {
    throw new Error('Flow not found');
  }

  // Org admins can only update their own organization's flows
  if (session.user.role === 'org_admin') {
    if (existingFlow.organizationId !== session.user.organizationId) {
      throw new Error('Unauthorized: You can only update flows belonging to your organization');
    }
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
  
  // Org admins and super admins can delete flows
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
  }

  // Get the flow to check ownership
  const [existingFlow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  if (!existingFlow) {
    throw new Error('Flow not found');
  }

  // Org admins can only delete their own organization's flows
  if (session.user.role === 'org_admin') {
    if (existingFlow.organizationId !== session.user.organizationId) {
      throw new Error('Unauthorized: You can only delete flows belonging to your organization');
    }
  }

  await db.delete(flows).where(eq(flows.id, id));
  revalidatePath('/admin/flows');
}

export async function toggleFlowActive(id: string) {
  const session = await auth();
  
  // Org admins and super admins can toggle flow active status
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
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

  // Org admins can only toggle their own organization's flows
  if (session.user.role === 'org_admin') {
    if (currentFlow.organizationId !== session.user.organizationId) {
      throw new Error('Unauthorized: You can only activate flows belonging to your organization');
    }
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

  // Super admins see all flows
  if (session.user.role === 'super_admin') {
    const allFlows = await db.select().from(flows).orderBy(flows.createdAt);
    return allFlows;
  }

  // Org admins and staff see global flows (organizationId = null) OR their organization's flows
  const orgFlows = await db
    .select()
    .from(flows)
    .where(
      or(
        isNull(flows.organizationId), // Global flows
        eq(flows.organizationId, session.user.organizationId!) // Their org's flows
      )
    )
    .orderBy(flows.createdAt);
  
  return orgFlows;
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

  if (!flow) {
    return null;
  }

  // Super admins can access any flow
  if (session.user.role === 'super_admin') {
    return flow;
  }

  // Org admins and staff can only access global flows or their organization's flows
  if (flow.organizationId === null || flow.organizationId === session.user.organizationId) {
    return flow;
  }

  throw new Error('Unauthorized: You do not have access to this flow');
}

export async function publishFlow(id: string) {
  const session = await auth();
  
  // Org admins and super admins can publish flows
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
  }

  // Get the flow to check ownership
  const [existingFlow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  if (!existingFlow) {
    throw new Error('Flow not found');
  }

  // Org admins can only publish their own organization's flows
  if (session.user.role === 'org_admin') {
    if (existingFlow.organizationId !== session.user.organizationId) {
      throw new Error('Unauthorized: You can only publish flows belonging to your organization');
    }
  }

  // Publish the flow (set isDraft to false)
  const [updatedFlow] = await db
    .update(flows)
    .set({
      isDraft: false,
      updatedAt: new Date(),
    })
    .where(eq(flows.id, id))
    .returning();

  revalidatePath('/admin/flows');
  return updatedFlow;
}

export async function unpublishFlow(id: string) {
  const session = await auth();
  
  // Org admins and super admins can unpublish flows
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
  }

  // Get the flow to check ownership
  const [existingFlow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  if (!existingFlow) {
    throw new Error('Flow not found');
  }

  // Org admins can only unpublish their own organization's flows
  if (session.user.role === 'org_admin') {
    if (existingFlow.organizationId !== session.user.organizationId) {
      throw new Error('Unauthorized: You can only unpublish flows belonging to your organization');
    }
  }

  // Unpublish the flow (set isDraft to true and deactivate)
  const [updatedFlow] = await db
    .update(flows)
    .set({
      isDraft: true,
      isActive: false, // Ensure draft flows are never active
      updatedAt: new Date(),
    })
    .where(eq(flows.id, id))
    .returning();

  revalidatePath('/admin/flows');
  return updatedFlow;
}

// Unified state transition: cycles through Draft → Inactive → Active
export async function cycleFlowStatus(id: string) {
  const session = await auth();
  
  // Org admins and super admins can change flow status
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    throw new Error('Unauthorized: Flow management requires Organization Admin or Super Admin role');
  }

  // Get the flow to check ownership and current state
  const [existingFlow] = await db
    .select()
    .from(flows)
    .where(eq(flows.id, id))
    .limit(1);

  if (!existingFlow) {
    throw new Error('Flow not found');
  }

  // Org admins can only modify their own organization's flows
  if (session.user.role === 'org_admin') {
    if (existingFlow.organizationId !== session.user.organizationId) {
      throw new Error('Unauthorized: You can only modify flows belonging to your organization');
    }
  }

  // Determine next state
  let newState: { isDraft: boolean; isActive: boolean };
  
  if (existingFlow.isDraft) {
    // Draft → Inactive (publish but don't activate)
    newState = { isDraft: false, isActive: false };
  } else if (!existingFlow.isActive) {
    // Inactive → Active
    newState = { isDraft: false, isActive: true };
  } else {
    // Active → Inactive
    newState = { isDraft: false, isActive: false };
  }

  const [updatedFlow] = await db
    .update(flows)
    .set({
      ...newState,
      updatedAt: new Date(),
    })
    .where(eq(flows.id, id))
    .returning();

  revalidatePath('/admin/flows');
  return updatedFlow;
}
