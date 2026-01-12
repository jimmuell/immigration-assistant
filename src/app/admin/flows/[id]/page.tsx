import { requireRole } from "@/lib/role-middleware";
import { getFlowById } from "../actions";
import { notFound } from "next/navigation";
import FlowEditClient from "./flow-edit-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFlowPage({ params }: PageProps) {
  // Org admins and super admins can edit flows
  const session = await requireRole(['super_admin', 'org_admin']);
  
  const { id } = await params;
  const flow = await getFlowById(id);

  if (!flow) {
    notFound();
  }

  // Org admins can only edit their organization's flows (not global flows)
  if (session.user.role === 'org_admin') {
    if (flow.organizationId === null || flow.organizationId !== session.user.organizationId) {
      notFound();
    }
  }

  return <FlowEditClient flow={flow} />;
}
