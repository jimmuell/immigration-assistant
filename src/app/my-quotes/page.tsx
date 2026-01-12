import { requireRole } from "@/lib/role-middleware";
import MyQuotesClient from "./my-quotes-client";

export default async function MyQuotesPage() {
  await requireRole(['client']);
  
  return <MyQuotesClient />;
}
