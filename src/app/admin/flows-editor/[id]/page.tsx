import { requireRole } from '@/lib/role-middleware';
import { notFound } from 'next/navigation';
import { getFlow } from '../actions';
import FlowEditorClient from './flow-editor-client';

export default async function FlowEditorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Super admins and org admins can access the flow editor
  const session = await requireRole(['super_admin', 'org_admin']);

  const { id } = await params;
  const result = await getFlow(id);

  if ('error' in result || !result.flow) {
    notFound();
  }

  // Org admins can only edit their organization's flows (not global flows)
  if (session.user.role === 'org_admin') {
    if (result.flow.organizationId === null) {
      // This is a global flow, org admins can't edit it
      notFound();
    }
    if (result.flow.organizationId !== session.user.organizationId) {
      // This flow belongs to another organization
      notFound();
    }
  }

  return (
    <FlowEditorClient
      flowId={id}
      flowName={result.flow.name}
      initialNodes={result.nodes as any}
      initialEdges={result.edges}
      userRole={session.user.role}
    />
  );
}
