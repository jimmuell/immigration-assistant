import { requireRole } from '@/lib/role-middleware';
import { db } from '@/lib/db';
import { flows } from '@/lib/db/schema';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function FlowsEditorPage() {
  // Only super admins can access the flow editor
  await requireRole(['super_admin']);

  const allFlows = await db.select().from(flows);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Visual Flow Editor</h1>
          <p className="text-muted-foreground mt-2">
            Create and edit immigration screening flows with a visual node-based editor
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/flows">Back to Flows</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allFlows.map((flow) => (
          <Link
            key={flow.id}
            href={`/admin/flows-editor/${flow.id}`}
            className="block p-6 bg-card border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{flow.name}</h3>
            {flow.description && (
              <p className="text-sm text-muted-foreground mb-4">{flow.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`px-2 py-1 rounded ${flow.isActive ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'}`}>
                {flow.isActive ? 'Active' : 'Inactive'}
              </span>
              <span suppressHydrationWarning>Updated {new Date(flow.updatedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}</span>
            </div>
          </Link>
        ))}
      </div>

      {allFlows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No flows available yet.</p>
          <Button asChild>
            <Link href="/admin/flows">Create a flow first</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
