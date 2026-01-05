import { requireRole } from "@/lib/role-middleware";
import { getFlowById } from "../actions";
import { notFound } from "next/navigation";
import FlowEditClient from "./flow-edit-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFlowPage({ params }: PageProps) {
  // Only super admins can edit flows
  await requireRole(['super_admin']);
  
  const { id } = await params;
  const flow = await getFlowById(id);

  if (!flow) {
    notFound();
  }

  return <FlowEditClient flow={flow} />;
}
