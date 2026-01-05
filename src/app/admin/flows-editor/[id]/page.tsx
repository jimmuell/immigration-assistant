import { requireRole } from '@/lib/role-middleware';
import { notFound } from 'next/navigation';
import { getFlow } from '../actions';
import FlowEditorClient from './flow-editor-client';

export default async function FlowEditorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Only super admins can access the flow editor
  await requireRole(['super_admin']);

  const { id } = await params;
  const result = await getFlow(id);

  if ('error' in result || !result.flow) {
    notFound();
  }

  return (
    <FlowEditorClient
      flowId={id}
      flowName={result.flow.name}
      initialNodes={result.nodes as any}
      initialEdges={result.edges}
    />
  );
}
