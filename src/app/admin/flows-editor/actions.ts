'use server';

import { db } from '@/lib/db';
import { flows, formNodes, formEdges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import type { FormNode, FormEdge } from '@/types';

export async function getFlow(flowId: string) {
  try {
    const [flow] = await db.select().from(flows).where(eq(flows.id, flowId));
    
    if (!flow) {
      return { error: 'Flow not found' };
    }

    const nodes = await db.select().from(formNodes).where(eq(formNodes.flowId, flowId));
    const edges = await db.select().from(formEdges).where(eq(formEdges.flowId, flowId));

    return {
      flow,
      nodes: nodes.map(node => ({
        id: node.nodeId,
        type: node.type,
        data: node.data as any,
        position: node.position as { x: number; y: number }
      })),
      edges: edges.map(edge => ({
        id: edge.edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
        targetHandle: edge.targetHandle || undefined,
        data: edge.data as any
      }))
    };
  } catch (error) {
    console.error('Error fetching flow:', error);
    return { error: 'Failed to fetch flow' };
  }
}

export async function saveFlowNodes(flowId: string, nodes: FormNode[]) {
  // Org admins and super admins can edit flows
  const session = await auth();
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    return { error: 'Unauthorized: Flow management requires Organization Admin or Super Admin role' };
  }

  try {
    // Check flow ownership
    const [flow] = await db.select().from(flows).where(eq(flows.id, flowId));
    if (!flow) {
      return { error: 'Flow not found' };
    }

    // Org admins can only edit their organization's flows
    if (session.user.role === 'org_admin') {
      if (flow.organizationId !== session.user.organizationId) {
        return { error: 'Unauthorized: You can only edit flows belonging to your organization' };
      }
    }

    // Delete existing nodes for this flow
    await db.delete(formNodes).where(eq(formNodes.flowId, flowId));

    // Insert new nodes
    if (nodes.length > 0) {
      await db.insert(formNodes).values(
        nodes.map(node => ({
          flowId,
          nodeId: node.id,
          type: node.type,
          data: node.data as any,
          position: node.position as any
        }))
      );
    }

    revalidatePath(`/admin/flows-editor/${flowId}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving nodes:', error);
    return { error: 'Failed to save nodes' };
  }
}

export async function saveFlowEdges(flowId: string, edges: FormEdge[]) {
  // Org admins and super admins can edit flows
  const session = await auth();
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    return { error: 'Unauthorized: Flow management requires Organization Admin or Super Admin role' };
  }

  try {
    // Check flow ownership
    const [flow] = await db.select().from(flows).where(eq(flows.id, flowId));
    if (!flow) {
      return { error: 'Flow not found' };
    }

    // Org admins can only edit their organization's flows
    if (session.user.role === 'org_admin') {
      if (flow.organizationId !== session.user.organizationId) {
        return { error: 'Unauthorized: You can only edit flows belonging to your organization' };
      }
    }

    // Delete existing edges for this flow
    await db.delete(formEdges).where(eq(formEdges.flowId, flowId));

    // Insert new edges
    if (edges.length > 0) {
      await db.insert(formEdges).values(
        edges.map(edge => ({
          flowId,
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
          data: edge.data as any
        }))
      );
    }

    revalidatePath(`/admin/flows-editor/${flowId}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving edges:', error);
    return { error: 'Failed to save edges' };
  }
}

export async function updateFlowContent(flowId: string, content: string) {
  // Org admins and super admins can edit flows
  const session = await auth();
  if (!session || !['org_admin', 'super_admin'].includes(session.user.role)) {
    return { error: 'Unauthorized: Flow management requires Organization Admin or Super Admin role' };
  }

  try {
    // Check flow ownership
    const [flow] = await db.select().from(flows).where(eq(flows.id, flowId));
    if (!flow) {
      return { error: 'Flow not found' };
    }

    // Org admins can only edit their organization's flows
    if (session.user.role === 'org_admin') {
      if (flow.organizationId !== session.user.organizationId) {
        return { error: 'Unauthorized: You can only edit flows belonging to your organization' };
      }
    }

    await db.update(flows)
      .set({ content, updatedAt: new Date() })
      .where(eq(flows.id, flowId));

    revalidatePath(`/admin/flows-editor/${flowId}`);
    revalidatePath(`/admin/flows/${flowId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating flow content:', error);
    return { error: 'Failed to update flow content' };
  }
}
