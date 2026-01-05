import { requireRole, getCurrentUser } from "@/lib/role-middleware";
import { getFlows } from "./actions";
import FlowsClient from "./flows-client";

export default async function FlowsPage() {
  // Ensure user has admin role
  await requireRole(['org_admin', 'staff', 'super_admin']);

  const user = await getCurrentUser();
  const flows = await getFlows();

  return <FlowsClient initialFlows={flows} userRole={user?.role} />;
}
