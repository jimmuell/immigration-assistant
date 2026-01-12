import { requireRole } from "@/lib/role-middleware";
import AttorneyQuotesClient from "./attorney-quotes-client";

export default async function AttorneyQuotesPage() {
  await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
  
  return <AttorneyQuotesClient />;
}
